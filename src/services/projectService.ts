import { mockProjects } from '../data/mockData';
import type { CreateProjectInput, Project, UpdateProjectInput } from '../types';

const PROJECTS_KEY = 'pw_projects';

function loadProjects(): Project[] {
  const stored = localStorage.getItem(PROJECTS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(mockProjects));
  return structuredClone(mockProjects);
}

function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultFolders(projectId: string): Project['folders'] {
  return ['Informative Data', 'Analysis Data', 'Analytics Data', 'Reports'].map((name) => ({
    id: `${projectId}-folder-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    files: [],
  }));
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    await delay(200);
    return loadProjects();
  },

  async getProject(id: string): Promise<Project | null> {
    await delay(150);
    const projects = loadProjects();
    return projects.find((p) => p.id === id) ?? null;
  },

  async searchProjects(query: string): Promise<Project[]> {
    await delay(100);
    const projects = loadProjects();
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    await delay(300);

    if (!input.name.trim()) {
      throw new Error('Project name is required.');
    }

    const projects = loadProjects();
    const id = generateId();
    const project: Project = {
      id,
      name: input.name.trim(),
      assignedEmployeeIds: input.assignedEmployeeIds,
      createdAt: new Date().toISOString().split('T')[0],
      folders: createDefaultFolders(id),
    };

    projects.unshift(project);
    saveProjects(projects);
    return project;
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    await delay(300);

    const projects = loadProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found.');

    if (input.name !== undefined && !input.name.trim()) {
      throw new Error('Project name is required.');
    }

    const updated: Project = {
      ...projects[index],
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.assignedEmployeeIds !== undefined && { assignedEmployeeIds: input.assignedEmployeeIds }),
    };

    projects[index] = updated;
    saveProjects(projects);
    return updated;
  },

  async deleteProject(id: string): Promise<void> {
    await delay(300);
    const projects = loadProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) {
      throw new Error('Project not found.');
    }
    saveProjects(filtered);
  },

  async saveProject(project: Project): Promise<Project> {
    await delay(100);
    const projects = loadProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index === -1) throw new Error('Project not found.');
    projects[index] = project;
    saveProjects(projects);
    return project;
  },

  getTotalFileCount(): number {
    const projects = loadProjects();
    return projects.reduce(
      (total, project) =>
        total + project.folders.reduce((ft, folder) => ft + folder.files.length, 0),
      0,
    );
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Future: GET/POST/PUT/DELETE /api/projects
