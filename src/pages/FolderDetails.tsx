import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { FilePreview } from '../components/files/FilePreview';
import { FileTable } from '../components/files/FileTable';
import { FileUpload } from '../components/files/FileUpload';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fileService } from '../services/fileService';
import { projectService } from '../services/projectService';
import type { Project, ProjectFile } from '../types';

export function FolderDetails() {
  const { projectId, folderId } = useParams<{ projectId: string; folderId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [deleteFile, setDeleteFile] = useState<ProjectFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId || !folderId) return;
    setLoading(true);
    const proj = await projectService.getProject(projectId);
    setProject(proj);
    const folderFiles = await fileService.getFiles(projectId, folderId);
    setFiles(folderFiles);
    setLoading(false);
  }, [projectId, folderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const folder = project?.folders.find((f) => f.id === folderId);

  const handleUpload = async (uploadFiles: File[]) => {
    if (!projectId || !folderId || !user) return;
    await fileService.uploadFiles(projectId, folderId, uploadFiles, user.name);
    showToast('Files uploaded successfully.');
    await loadData();
  };

  const handleDelete = async () => {
    if (!projectId || !folderId || !deleteFile) return;
    setDeleting(true);
    try {
      await fileService.deleteFile(projectId, folderId, deleteFile.id);
      showToast('File deleted successfully.');
      setDeleteFile(null);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete file.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout
        breadcrumbs={[
          { label: 'Projects', path: '/projects' },
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
      <Layout breadcrumbs={[{ label: 'Projects', path: '/projects' }]}>
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Folder not found.</p>
          <Link to="/projects" className="mt-4 inline-block text-sm text-slate-700 hover:underline">
            Back to Projects
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      breadcrumbs={[
        { label: 'Projects', path: '/projects' },
        { label: project.name, path: `/projects/${project.id}` },
        { label: folder.name },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Folder {folder.name}</h1>
        <p className="mt-1 text-sm text-slate-600">{project.name}</p>
      </div>

      <div className="mb-6">
        <FileUpload onUpload={handleUpload} />
      </div>

      <FileTable
        files={files}
        onPreview={setPreviewFile}
        onDelete={setDeleteFile}
      />

      <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />

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
        onCancel={() => setDeleteFile(null)}
        isLoading={deleting}
      />
    </Layout>
  );
}
