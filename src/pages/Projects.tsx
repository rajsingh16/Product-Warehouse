import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { Layout } from '../components/layout/Layout';
import { ProjectForm } from '../components/projects/ProjectForm';
import { ProjectSearch } from '../components/projects/ProjectSearch';
import { ProjectTable } from '../components/projects/ProjectTable';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import type { Project } from '../types';
import { can } from '../utils/authorization';

export function Projects() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadProjects = async () => {
    setLoading(true);
    try { setLoadError(''); setProjects(await projectService.getProjects()); }
    catch (err) { setLoadError(err instanceof Error ? err.message : 'Failed to load projects.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const visibleProjects = projects.slice((page - 1) * pageSize, page * pageSize);

  const handleCreate = async (data: { name: string; assignedEmployeeIds: string[] }) => {
    const project = await projectService.createProject(data);
    showToast('Project created successfully.');
    setCreateOpen(false);
    await loadProjects();
    navigate(`/projects/${project.id}`);
  };

  const handleUpdate = async (data: { name: string; assignedEmployeeIds: string[] }) => {
    if (!editProject) return;
    await projectService.updateProject(editProject.id, data);
    showToast('Project updated successfully.');
    setEditProject(null);
    await loadProjects();
  };

  const handleDelete = async () => {
    if (!deleteProject) return;
    setDeleting(true);
    try {
      await projectService.deleteProject(deleteProject.id);
      showToast('Project deleted successfully.');
      setDeleteProject(null);
      await loadProjects();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete project.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout breadcrumbs={[{ label: 'Projects', path: '/projects' }]}>
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and organize your projects</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ProjectSearch />
          {can(user, 'projects:create') && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{loadError}</div>
      ) : (
        <><ProjectTable projects={visibleProjects} onEdit={can(user, 'projects:edit') ? setEditProject : undefined} onDelete={can(user, 'projects:delete') ? setDeleteProject : undefined} /><Pagination page={page} pageSize={pageSize} total={projects.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Project" size="lg">
        <ProjectForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!editProject}
        onClose={() => setEditProject(null)}
        title="Edit Project"
      >
        {editProject && (
          <ProjectForm
            initialData={editProject}
            submitLabel="Save Changes"
            onSubmit={handleUpdate}
            onCancel={() => setEditProject(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteProject}
        title="Delete Project?"
        message={
          deleteProject
            ? `Are you sure you want to delete "${deleteProject.name}"?`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteProject(null)}
        isLoading={deleting}
      />
    </Layout>
  );
}
