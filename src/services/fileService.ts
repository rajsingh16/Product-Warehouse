import { apiRequest } from './apiClient';

import { SUPPORTED_EXTENSIONS } from '../types';

import type { ProjectFile } from '../types';

/**
 * ROOT-CAUSE FIX: raw fetch() does not go through apiRequest, so a relative '/api/...'
 * hit the Vite dev server (which answered with index.html). This MUST resolve to the same
 * backend base URL that apiClient.ts uses. Adjust the env var name if yours differs.
 */
const API_BASE_URL = String(import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

type ApiFile = {
  id: string;
  project_id: string;
  folder_id: string;
  file_name: string;
  blob_name: string;
  file_type: string;
  content_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
};

function mapFile(file: ApiFile): ProjectFile {
  return {
    id: file.id,
    name: file.file_name,
    type: file.file_type,
    size: Number(file.file_size),
    uploadedBy: file.uploaded_by,
    uploadedAt: file.uploaded_at,
  };
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
    '.txt': 'txt', '.doc': 'doc', '.docx': 'docx', '.pdf': 'pdf',
    '.xls': 'xls', '.xlsx': 'xlsx', '.csv': 'csv', '.json': 'json',
    '.jpg': 'jpg', '.jpeg': 'jpeg', '.png': 'png', '.gif': 'gif', '.webp': 'webp',
  };
  return map[ext] ?? 'unknown';
}

export function getFileTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    txt: 'Text', doc: 'Word', docx: 'Word', pdf: 'PDF', xls: 'Excel', xlsx: 'Excel',
    csv: 'CSV', json: 'JSON', jpg: 'Image', jpeg: 'Image', png: 'Image', gif: 'Image', webp: 'Image',
  };
  return labels[type] ?? type.toUpperCase();
}

/** Single source of truth for what can be previewed. */
const PREVIEW_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export const getPreviewMimeType = (type: string): string | undefined =>
  Object.prototype.hasOwnProperty.call(PREVIEW_MIME_TYPES, type.toLowerCase())
    ? PREVIEW_MIME_TYPES[type.toLowerCase()]
    : undefined;

export const isImageType = (type: string) => getPreviewMimeType(type)?.startsWith('image/') ?? false;
export const isPdfType = (type: string) => type.toLowerCase() === 'pdf';

/** Authenticated GET of the raw file bytes, shared by preview and download. */
async function fetchFileBlob(file: ProjectFile, failureMessage: string): Promise<Blob> {
  const token = localStorage.getItem('pw_access_token');
  if (!token) throw new Error('Authentication required');

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(file.id)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Could not reach the server.');
  }

  if (!response.ok) {
    let message = failureMessage;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // Ignore JSON parsing failure.
    }
    throw new Error(message);
  }

  // Guard: the dev server (or any SPA fallback) answers 200 with HTML for unknown routes.
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    throw new Error('The server returned a web page instead of the file. Check the API base URL / proxy configuration.');
  }

  return response.blob();
}

export const fileService = {
  getUniqueFileName,

  async getFiles(projectId: string, folderId: string): Promise<ProjectFile[]> {
    const files = await apiRequest<ApiFile[]>(
      `/api/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/files`
    );
    return files.map(mapFile);
  },

  async uploadFiles(
    projectId: string,
    folderId: string,
    files: File[],
    _uploadedBy: string,
    onProgress?: (percent: number) => void
  ): Promise<ProjectFile[]> {
    const invalid = files.filter((file) => !isSupportedFile(file.name));
    if (invalid.length > 0) throw new Error('This file type is not supported.');

    const uploaded: ProjectFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);

      const response = await apiRequest<ApiFile>(
        `/api/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/files`,
        { method: 'POST', body: formData }
      );
      uploaded.push(mapFile(response));
      onProgress?.(Math.round(((i + 1) / files.length) * 100));
    }
    return uploaded;
  },

  async deleteFile(_projectId: string, _folderId: string, fileId: string): Promise<void> {
    await apiRequest(`/api/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
  },

  /** Returns an object URL. The CALLER owns it and must revoke it when done. */
  async getPreviewUrl(file: ProjectFile): Promise<string> {
    const mime = getPreviewMimeType(file.type);
    if (!mime) throw new Error('Preview is not available for this file type.');

    const blob = await fetchFileBlob(file, 'Failed to load file preview.');
    if (blob.size === 0) throw new Error('The file is empty.');

    // Force the MIME type from the known file type instead of trusting the response header.
    return URL.createObjectURL(new Blob([blob], { type: mime }));
  },

  async downloadFile(file: ProjectFile): Promise<void> {
    const blob = await fetchFileBlob(file, 'Failed to download file.');
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};