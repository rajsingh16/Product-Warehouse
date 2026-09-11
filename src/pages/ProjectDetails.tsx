import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEmployeeNames } from '../data/mockData';
import { Layout } from '../components/layout/Layout';
import { FolderCard } from '../components/projects/FolderCard';
import { projectService } from '../services/projectService';
import type { Project } from '../types';

export function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    projectService.getProject(projectId).then((data) => {
      setProject(data);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return (
      <Layout breadcrumbs={[{ label: 'Projects', path: '/projects' }]}>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout breadcrumbs={[{ label: 'Projects', path: '/projects' }]}>
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Project not found.</p>
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
        { label: project.name },
      ]}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium">Assigned To:</span>{' '}
          {project.assignedEmployeeNames?.join(', ') || getEmployeeNames(project.assignedEmployeeIds)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
        {project.folders.map((folder) => (
          <FolderCard key={folder.id} projectId={project.id} folder={folder} />
        ))}
      </div>
    </Layout>
  );
}
