import { FileText, FolderKanban, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../data/mockData';
import { Layout } from '../components/layout/Layout';
import { projectService } from '../services/projectService';
import { employeeService } from '../services/employeeService';
import type { Project } from '../types';

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    Promise.all([projectService.getProjects(), employeeService.getEmployees()]).then(([data, employees]) => {
      setProjects(data); setTotalEmployees(employees.length); setTotalFiles(projectService.getTotalFileCount()); setLoading(false);
    });
  }, []);

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderKanban },
    { label: 'Total Employees', value: totalEmployees, icon: Users },
    { label: 'Total Files', value: totalFiles, icon: FileText },
  ];

  const recentProjects = projects.slice(0, 5);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your projects and team</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Recent Projects</h2>
            </div>
            {recentProjects.length === 0 ? (
              <p className="p-8 text-center text-slate-500">No projects yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 font-medium text-slate-600">Project Name</th>
                      <th className="px-5 py-3 font-medium text-slate-600">Assigned To</th>
                      <th className="px-5 py-3 font-medium text-slate-600">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <Link
                            to={`/projects/${project.id}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {project.assignedEmployeeNames?.join(', ') ?? ''}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(project.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
