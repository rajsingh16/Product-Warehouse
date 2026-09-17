import { apiRequest } from './apiClient';

import { SUPPORTED_EXTENSIONS } from '../types';

import type { ProjectFile } from '../types';

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

export function getUniqueFileName(
  fileName: string,
  existingFiles: Pick<ProjectFile, 'name'>[]
): string {
  const existingNames = new Set(
    existingFiles.map((file) => file.name.toLowerCase())
  );

  if (!existingNames.has(fileName.toLowerCase())) {
    return fileName;
  }

  const dot = fileName.lastIndexOf('.');

  const baseName =
    dot === -1
      ? fileName
      : fileName.slice(0, dot);

  const extension =
    dot === -1
      ? ''
      : fileName.slice(dot);

  let suffix = 1;

  let candidate =
    `${baseName} (${suffix})${extension}`;

  while (
    existingNames.has(candidate.toLowerCase())
  ) {
    suffix += 1;

    candidate =
      `${baseName} (${suffix})${extension}`;
  }

  return candidate;
}

export function isSupportedFile(
  filename: string
): boolean {
  const ext = getFileExtension(filename);

  return SUPPORTED_EXTENSIONS.includes(
    ext as (typeof SUPPORTED_EXTENSIONS)[number]
  );
}

export function getFileTypeFromExtension(
  filename: string
): string {
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

export function getFileTypeLabel(
  type: string
): string {
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
  getUniqueFileName,
  async getFiles(
    projectId: string,
    folderId: string
  ): Promise<ProjectFile[]> {
    const files =
      await apiRequest<ApiFile[]>(
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
    const invalid = files.filter(
      (file) => !isSupportedFile(file.name)
    );

    if (invalid.length > 0) {
      throw new Error(
        'This file type is not supported.'
      );
    }

    const uploaded: ProjectFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const formData = new FormData();

      formData.append('file', file);

      const response =
        await apiRequest<ApiFile>(
          `/api/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/files`,
          {
            method: 'POST',
            body: formData,
          }
        );

      uploaded.push(mapFile(response));

      onProgress?.(
        Math.round(
          ((i + 1) / files.length) * 100
        )
      );
    }

    return uploaded;
  },

  async deleteFile(
    _projectId: string,
    _folderId: string,
    fileId: string
  ): Promise<void> {
    await apiRequest(
      `/api/files/${encodeURIComponent(fileId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  async downloadFile(
    file: ProjectFile
  ): Promise<void> {
    const response =
      await fetch(
        `/api/files/${encodeURIComponent(file.id)}`,
        {
          credentials: 'include',
        }
      );

    if (!response.ok) {
      let message =
        'Failed to download file.';

      try {
        const data =
          await response.json();

        if (data?.message) {
          message = data.message;
        }
      } catch {
        // Ignore JSON parsing failure.
      }

      throw new Error(message);
    }

    const blob =
      await response.blob();

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;
    anchor.download = file.name;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  },
};