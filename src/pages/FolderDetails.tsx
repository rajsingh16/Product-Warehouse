import { useCallback, useEffect, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { Plus } from 'lucide-react';

import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { FilePreview } from '../components/files/FilePreview';
import { FileTable } from '../components/files/FileTable';
import { FileUpload } from '../components/files/FileUpload';
import { Layout } from '../components/layout/Layout';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { apiRequest } from '../services/apiClient';
import { fileService,getUniqueFileName, } from '../services/fileService';
import { projectService } from '../services/projectService';

import type {
  Folder,
  Project,
  ProjectFile,
} from '../types';

import { can } from '../utils/authorization';

export function FolderDetails() {
  const {
    projectId,
    folderId,
  } = useParams<{
    projectId: string;
    folderId: string;
  }>();

  const { user } = useAuth();

  const canViewDocuments =
    can(user, 'document_view');

  const canUploadDocuments =
    can(user, 'document_upload');

  const canDeleteDocuments =
    can(user, 'document_delete');

  const { showToast } = useToast();

  const [project, setProject] =
    useState<Project | null>(null);

  const [files, setFiles] =
    useState<ProjectFile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [previewFile, setPreviewFile] =
    useState<ProjectFile | null>(null);

  const [deleteFile, setDeleteFile] =
    useState<ProjectFile | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const [createFolderOpen, setCreateFolderOpen] =
    useState(false);

  const [newFolderName, setNewFolderName] =
    useState('');

  const [creatingFolder, setCreatingFolder] =
    useState(false);

  const loadData = useCallback(async () => {
    if (!projectId || !folderId) {
      return;
    }

    setLoading(true);

    try {
      const proj =
        await projectService.getProject(projectId);

      setProject(proj);

      if (canViewDocuments) {
        const folderFiles =
          await fileService.getFiles(
            projectId,
            folderId
          );

        setFiles(folderFiles);
      } else {
        setFiles([]);
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to load folder.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [
    projectId,
    folderId,
    canViewDocuments,
    showToast,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const findFolder = (
    folders: Folder[]
  ): Folder | undefined => {
    for (const item of folders) {
      if (item.id === folderId) {
        return item;
      }

      const nested = findFolder(
        item.folders ?? []
      );

      if (nested) {
        return nested;
      }
    }

    return undefined;
  };

  const folder =
    project
      ? findFolder(project.folders)
      : undefined;

  /*
   * Create a new folder inside the
   * currently opened folder.
   */
  const handleCreateFolder = async () => {
    if (!projectId || !folder) {
      return;
    }

    const name =
      newFolderName.trim();

    if (!name) {
      showToast(
        'Folder name is required.',
        'error'
      );
      return;
    }

    const children =
      folder.folders ?? [];

    if (
      children.some(
        (child) =>
          child.name.toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      showToast(
        'A folder with that name already exists.',
        'error'
      );
      return;
    }

    setCreatingFolder(true);

    try {
      await apiRequest(
        `/api/projects/${encodeURIComponent(projectId)}/folders`,
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            parentFolderId: folder.id,
          }),
        }
      );

      showToast(
        'Folder created successfully.'
      );

      setNewFolderName('');
      setCreateFolderOpen(false);

      /*
       * Reload from PostgreSQL so the UI
       * reflects the actual backend state.
       */
      await loadData();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to create folder.',
        'error'
      );
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUpload = async (uploadFiles: File[]) => {
    if (!projectId || !folderId || !user) {
      return;
    }
  
    if (!canUploadDocuments) {
      showToast(
        'You do not have permission to upload documents.',
        'error'
      );
      return;
    }
  
    try {
      /*
       * Keep track of the files that already exist
       * in this folder.
       */
      const existingFiles = [...files];
  
      /*
       * These are the files we have decided to upload
       * during this upload operation.
       */
      const filesToUpload: File[] = [];
  
      /*
       * Keep track of names already used during this
       * upload operation as well.
       */
      const usedNames = new Set(
        existingFiles.map((file) => file.name.toLowerCase())
      );
  
      for (const file of uploadFiles) {
        const originalName = file.name;
  
        /*
         * Check whether this filename already exists.
         */
        const isDuplicate = usedNames.has(
          originalName.toLowerCase()
        );
  
        let finalName = originalName;
  
        if (isDuplicate) {
          /*
           * Find the next available filename.
           */
          const existingForNaming = [
            ...existingFiles,
            ...filesToUpload.map((uploadedFile) => ({
              name: uploadedFile.name,
            })),
          ];
  
          finalName = getUniqueFileName(
            originalName,
            existingForNaming
          );
  
          const shouldUpload = window.confirm(
            `A file named "${originalName}" already exists in this folder.\n\n` +
            `If you continue, the new file will be saved as "${finalName}".\n\n` +
            `Do you want to continue?`
          );
  
          if (!shouldUpload) {
            continue;
          }
        }
  
        /*
         * Create a new File object only when the
         * filename needs to change.
         */
        const fileToUpload =
          finalName === originalName
            ? file
            : new File(
                [file],
                finalName,
                {
                  type: file.type,
                  lastModified: file.lastModified,
                }
              );
  
        filesToUpload.push(fileToUpload);
  
        /*
         * Mark this name as used so another duplicate
         * in the same selection gets the next number.
         */
        usedNames.add(finalName.toLowerCase());
      }
  
      if (filesToUpload.length === 0) {
        return;
      }
  
      await fileService.uploadFiles(
        projectId,
        folderId,
        filesToUpload,
        user.name
      );
  
      showToast('Files uploaded successfully.');
  
      await loadData();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to upload files.',
        'error'
      );
    }
  };

  const handleDelete = async () => {
    if (
      !projectId ||
      !folderId ||
      !deleteFile
    ) {
      return;
    }

    if (!canDeleteDocuments) {
      showToast(
        'You do not have permission to delete documents.',
        'error'
      );
      return;
    }

    setDeleting(true);

    try {
      await fileService.deleteFile(
        projectId,
        folderId,
        deleteFile.id
      );

      showToast(
        'File deleted successfully.'
      );

      setDeleteFile(null);

      await loadData();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to delete file.',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout
        breadcrumbs={[
          {
            label: 'Projects',
            path: '/projects',
          },
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        </div>
      </Layout>
    );
  }

  if (!project || !folder) {
    return (
      <Layout
        breadcrumbs={[
          {
            label: 'Projects',
            path: '/projects',
          },
        ]}
      >
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">
            Folder not found.
          </p>

          <Link
            to="/projects"
            className="mt-4 inline-block text-sm text-slate-700 hover:underline"
          >
            Back to Projects
          </Link>
        </div>
      </Layout>
    );
  }
  const isRootFolder =
  project.folders.some((rootFolder) => rootFolder.id === folder.id);
  return (
    <Layout
      breadcrumbs={[
        {
          label: 'Projects',
          path: '/projects',
        },
        {
          label: project.name,
          path: `/projects/${project.id}`,
        },
        {
          label: folder.name,
        },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Folder {folder.name}
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          {project.name}
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        {canUploadDocuments && isRootFolder && (
          <button
            type="button"
            onClick={() => {
              setNewFolderName('');
              setCreateFolderOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />

            New Folder
          </button>
        )}

        <div className="ml-auto">
          {canUploadDocuments && (
            <FileUpload
              onUpload={handleUpload}
            />
          )}
        </div>
      </div>

      <FileTable
        files={files}
        folders={folder.folders ?? []}
        project={project.id}
        onPreview={
          canViewDocuments
            ? setPreviewFile
            : undefined
        }
        onDelete={
          canDeleteDocuments
            ? setDeleteFile
            : undefined
        }
      />

      <FilePreview
        file={previewFile}
        onClose={() =>
          setPreviewFile(null)
        }
      />

      <Modal
        isOpen={createFolderOpen}
        onClose={() => {
          if (creatingFolder) {
            return;
          }

          setCreateFolderOpen(false);
          setNewFolderName('');
        }}
        title="Create New Folder"
        size="sm"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateFolder();
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="new-folder-name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Folder Name
            </label>

            <input
              id="new-folder-name"
              type="text"
              value={newFolderName}
              onChange={(event) =>
                setNewFolderName(
                  event.target.value
                )
              }
              placeholder="Enter folder name"
              autoFocus
              disabled={creatingFolder}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={creatingFolder}
              onClick={() => {
                setCreateFolderOpen(false);
                setNewFolderName('');
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={creatingFolder}
              onClick={handleCreateFolder}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
              {creatingFolder
              ? 'Creating...'
              : 'Create Folder'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteFile}
        title="Delete File?"
        message={
          deleteFile
            ? `Are you sure you want to delete "${deleteFile.name}"?`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteFile(null)
        }
        isLoading={deleting}
      />
    </Layout>
  );
}