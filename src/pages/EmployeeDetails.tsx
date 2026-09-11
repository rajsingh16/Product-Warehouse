import { Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { employeeService } from '../services/employeeService';
import { projectService } from '../services/projectService';
import type { Employee, Project } from '../types';

export function EmployeeDetails() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    Promise.all([
      employeeService.getEmployee(employeeId),
      projectService.getProjects(),
    ]).then(([emp, projs]) => {
      setEmployee(emp);
      setProjects(projs);
      setLoading(false);
    });
  }, [employeeId]);

  if (loading) {
    return (
      <Layout breadcrumbs={[{ label: 'Employees', path: '/employees' }]}>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout breadcrumbs={[{ label: 'Employees', path: '/employees' }]}>
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">Employee not found.</p>
          <Link to="/employees" className="mt-4 inline-block text-sm text-slate-700 hover:underline">
            Back to Employees
          </Link>
        </div>
      </Layout>
    );
  }

  const assignedProjects = projects.filter((p) => p.assignedEmployeeIds.includes(employee.id) || p.assignedEmployeeIds.includes(employee.employeeId));
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Layout
      breadcrumbs={[
        { label: 'Employees', path: '/employees' },
        { label: employee.name },
      ]}
    >
      <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-white">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{employee.name}</h1>
            <p className="text-sm text-slate-500">{employee.role}</p>
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                employee.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {employee.status}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="h-4 w-4" />
            <span>Employee ID: {employee.employeeId}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="h-4 w-4" />
            <span>{employee.email}</span>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="mb-3 font-medium text-slate-900">Assigned Projects</h2>
          {assignedProjects.length === 0 ? (
            <p className="text-sm text-slate-500">No projects assigned.</p>
          ) : (
            <ul className="space-y-2">
              {assignedProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-sm text-slate-700 hover:underline"
                  >
                    {project.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
