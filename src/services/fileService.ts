import { SUPPORTED_EXTENSIONS } from '../types';
import type { Folder, ProjectFile } from '../types';
import { projectService } from './projectService';

async function loadAndUpdate(
  projectId: string,
  folderId: string,
  updater: (files: ProjectFile[]) => ProjectFile[],
): Promise<ProjectFile[]> {
  const project = await projectService.getProject(projectId);
  if (!project) throw new Error('Project not found.');
  const folder = findFolder(project.folders, folderId);
  if (!folder) throw new Error('Folder not found.');

  folder.files = updater(folder.files);
  await projectService.saveProject(project);
  return folder.files;
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return '';
  return filename.slice(dot).toLowerCase();
}

export function getUniqueFileName(fileName: string, existingFiles: Pick<ProjectFile, 'name'>[]): string {
  const existingNames = new Set(existingFiles.map((file) => file.name.toLowerCase()));
  if (!existingNames.has(fileName.toLowerCase())) return fileName;

  const dot = fileName.lastIndexOf('.');
  const baseName = dot === -1 ? fileName : fileName.slice(0, dot);
  const extension = dot === -1 ? '' : fileName.slice(dot);
  let suffix = 1;
  let candidate = `${baseName} (${suffix})${extension}`;

  while (existingNames.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${baseName} (${suffix})${extension}`;
  }

  return candidate;
}

export function isSupportedFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number]);
}

export function getFileTypeFromExtension(filename: string): string {
  const ext = getFileExtension(filename);
  const map: Record<string, string> = {
    '.txt': 'txt',
    '.doc': 'doc',
    '.docx': 'docx',
    '.pdf': 'pdf',
    '.xls': 'xls',
    '.xlsx': 'xlsx',
    '.csv': 'csv',
    '.json': 'json',
    '.jpg': 'jpg',
    '.jpeg': 'jpeg',
  };
  return map[ext] ?? 'unknown';
}

export function getFileTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    txt: 'Text',
    doc: 'Word',
    docx: 'Word',
    pdf: 'PDF',
    xls: 'Excel',
    xlsx: 'Excel',
    csv: 'CSV',
    json: 'JSON',
    jpg: 'Image',
    jpeg: 'Image',
  };
  return labels[type] ?? type.toUpperCase();
}

export const fileService = {
  async getFiles(projectId: string, folderId: string): Promise<ProjectFile[]> {
    await delay(150);
    const project = await projectService.getProject(projectId);
    const folder = project ? findFolder(project.folders, folderId) : undefined;
    return folder?.files ?? [];
  },

  async uploadFiles(
    projectId: string,
    folderId: string,
    files: File[],
    uploadedBy: string,
    onProgress?: (percent: number) => void,
  ): Promise<ProjectFile[]> {
    const invalid = files.filter((f) => !isSupportedFile(f.name));
    if (invalid.length > 0) {
      throw new Error('This file type is not supported.');
    }

    const currentFiles = await this.getFiles(projectId, folderId);
    const uploaded: ProjectFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(Math.round(((i + 1) / files.length) * 100));
      await delay(200);

      const uniqueName = getUniqueFileName(file.name, [...currentFiles, ...uploaded]);
      const type = getFileTypeFromExtension(uniqueName);
      let content: string | undefined;
      let blobUrl: string | undefined;

      if (['txt', 'csv', 'json'].includes(type)) {
        content = await file.text();
      } else if (['jpg', 'jpeg', 'pdf'].includes(type)) {
        blobUrl = URL.createObjectURL(file);
      } else {
        blobUrl = URL.createObjectURL(file);
      }

      uploaded.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: uniqueName,
        type,
        size: file.size,
        uploadedBy,
        uploadedAt: new Date().toISOString().split('T')[0],
        content,
        blobUrl,
      });
    }

    await loadAndUpdate(projectId, folderId, (existing) => [...existing, ...uploaded]);
    return uploaded;
  },

  async deleteFile(projectId: string, folderId: string, fileId: string): Promise<void> {
    await delay(200);
    await loadAndUpdate(projectId, folderId, (files) => files.filter((f) => f.id !== fileId));
  },

  downloadFile(file: ProjectFile): void {
    if (file.blobUrl) {
      const a = document.createElement('a');
      a.href = file.blobUrl;
      a.download = file.name;
      a.click();
      return;
    }

    if (file.content) {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const blob = new Blob([`Mock file: ${file.name}`], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findFolder(folders: Folder[], id: string): Folder | undefined {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const nested = findFolder(folder.folders ?? [], id);
    if (nested) return nested;
  }
  return undefined;
}
