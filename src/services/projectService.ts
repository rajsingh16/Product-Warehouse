import { apiRequest, queryString } from './apiClient';

import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
  Folder,
} from '../types';

type ApiProject = {
  project_id: string;
  project_name: string;
  project_status: string;
  created_at: string;
  users: Array<{
    userId: string;
    userName?: string;
    empId?: string;
  }>;
};

type ApiFolder = {
  folder_id: string;
  project_id: string;
  parent_folder_id: string | null;
  folder_name: string;
  created_by?: string;
  created_at: string;
  file_count?: number;
};

function buildFolderTree(
  folders: ApiFolder[]
): Folder[] {
  const folderMap = new Map<string, Folder>();

  for (const folder of folders) {
    folderMap.set(folder.folder_id, {
      id: folder.folder_id,
      name: folder.folder_name,
      files: [],
      folders: [],
      fileCount: folder.file_count ?? 0,

    });
  }

  const roots: Folder[] = [];

  for (const folder of folders) {
    const mapped = folderMap.get(folder.folder_id);

    if (!mapped) continue;

    if (folder.parent_folder_id) {
      const parent = folderMap.get(folder.parent_folder_id);

      if (parent) {
        parent.folders ??= [];
        parent.folders.push(mapped);
      }
    } else {
      roots.push(mapped);
    }
  }

  return roots;
}

async function loadFolders(
  projectId: string
): Promise<Folder[]> {
  const folders = await apiRequest<ApiFolder[]>(
    `/api/projects/${encodeURIComponent(projectId)}/folders`
  );

  return buildFolderTree(folders);
}

function mapProject(
  project: ApiProject,
  folders: Folder[] = []
): Project {
  return {
    id: project.project_id,
    name: project.project_name,
    status: project.project_status,
    createdAt: project.created_at,
    assignedEmployeeIds:
      project.users?.map((user) => user.userId) ?? [],
    assignedEmployeeNames:
      project.users?.map(
        (user) =>
          user.userName ??
          user.empId ??
          user.userId
      ) ?? [],
    folders,
  };
}

async function assignUsers(
  projectId: string,
  userIds: string[]
) {
  await Promise.all(
    userIds.map((userId) =>
      apiRequest(
        `/api/projects/${encodeURIComponent(projectId)}/users`,
        {
          method: 'POST',
          body: JSON.stringify({ userId }),
        }
      )
    )
  );
}

export const projectService = {
  async getProjects() {
    const projects =
      await apiRequest<ApiProject[]>(
        '/api/projects?page=1&pageSize=100'
      );

    return Promise.all(
      projects.map(async (project) =>
        mapProject(
          project,
          await loadFolders(project.project_id)
        )
      )
    );
  },

  async getProject(id: string) {
    try {
      const project =
        await apiRequest<ApiProject>(
          `/api/projects/${encodeURIComponent(id)}`
        );

      const folders =
        await loadFolders(project.project_id);

      return mapProject(project, folders);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Project not found'
      ) {
        return null;
      }

      throw error;
    }
  },

  async searchProjects(query: string) {
    const projects =
      await apiRequest<ApiProject[]>(
        `/api/projects${queryString({
          search: query,
          page: 1,
          pageSize: 25,
        })}`
      );

    return Promise.all(
      projects.map(async (project) =>
        mapProject(
          project,
          await loadFolders(project.project_id)
        )
      )
    );
  },

  async createProject(
    input: CreateProjectInput
  ) {
    const id = `proj-${Date.now()}`;

    const created =
      await apiRequest<ApiProject>(
        '/api/projects',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: id,
            projectName: input.name,
            projectStatus: 'Active',
          }),
        }
      );

    await assignUsers(
      id,
      input.assignedEmployeeIds
    );

    const folders =
      await loadFolders(id);

    return mapProject(created, folders);
  },

  async updateProject(
    id: string,
    input: UpdateProjectInput
  ) {
    const current =
      await apiRequest<ApiProject>(
        `/api/projects/${encodeURIComponent(id)}`
      );

    const updated =
      await apiRequest<ApiProject>(
        `/api/projects/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            projectName:
              input.name ?? current.project_name,
            projectStatus:
              current.project_status,
          }),
        }
      );

    const existing =
      current.users?.map(
        (user) => user.userId
      ) ?? [];

    const desired =
      input.assignedEmployeeIds ??
      existing;

    await Promise.all(
      existing
        .filter(
          (userId) =>
            !desired.includes(userId)
        )
        .map((userId) =>
          apiRequest(
            `/api/projects/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}`,
            {
              method: 'DELETE',
            }
          )
        )
    );

    await assignUsers(
      id,
      desired.filter(
        (userId) =>
          !existing.includes(userId)
      )
    );

    const folders =
      await loadFolders(id);

    return mapProject(
      {
        ...updated,
        users: desired.map(
          (userId) => ({ userId })
        ),
      },
      folders
    );
  },

  async deleteProject(id: string) {
    await apiRequest(
      `/api/projects/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );
  },

  async getFolders(projectId: string) {
    return loadFolders(projectId);
  },
};