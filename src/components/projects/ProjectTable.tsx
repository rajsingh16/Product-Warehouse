import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatDate, getEmployeeNames } from '../../data/mockData';
import type { Project } from '../../types';
import { Button } from '../common/Button';

interface ProjectTableProps {
  projects: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function ProjectTable({ projects, onEdit, onDelete }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">
          No projects found. Create your first project to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Single scroll container — fills whatever height the parent flex gives it */}
      <div className="min-h-0 flex-1 overflow-auto">

        <table className="w-full min-w-[720px] text-left text-sm">

          <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50">
            <tr className=" border-b border-slate-200">
              <th className="sticky top-0 bg-slate-50 px-4 py-3 font-medium text-slate-600">
                Project Name
              </th>

              <th className="sticky top-0 bg-slate-50 px-4 py-3 font-medium text-slate-600">
                Assigned To
              </th>

              <th className="sticky top-0 bg-slate-50 px-4 py-3 font-medium text-slate-600">
                Created Date
              </th>

              <th className="sticky top-0 bg-slate-50 px-4 py-3 font-medium text-slate-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/projects/${project.id}`}
                    className="font-medium text-slate-900 hover:text-slate-600 hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {project.assignedEmployeeNames?.join(', ') ||
                    getEmployeeNames(project.assignedEmployeeIds)}
                </td>

                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {formatDate(project.createdAt)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(project)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    )}

                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(project)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}