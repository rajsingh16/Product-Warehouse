import { useEffect, useState } from 'react';
import { mockEmployees } from '../../data/mockData';
import type { Project } from '../../types';
import { Button } from '../common/Button';

interface ProjectFormProps {
  initialData?: Project;
  onSubmit: (data: { name: string; assignedEmployeeIds: string[] }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Project',
}: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialData?.assignedEmployeeIds ?? []);
  const [assignAll, setAssignAll] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignAll) {
      setSelectedIds(mockEmployees.map((e) => e.id));
    }
  }, [assignAll]);

  const toggleEmployee = (id: string) => {
    setAssignAll(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), assignedEmployeeIds: selectedIds });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div>
        <label htmlFor="projectName" className="mb-1.5 block text-sm font-medium text-slate-700">
          Project Name
        </label>
        <input
          id="projectName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Enter project name"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Assign Employees</p>
        <div className="space-y-2 rounded-md border border-slate-200 p-4">
          {mockEmployees.map((employee) => (
            <label key={employee.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(employee.id)}
                onChange={() => toggleEmployee(employee.id)}
                className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
              />
              <span className="text-sm text-slate-700">{employee.name}</span>
            </label>
          ))}
          <hr className="my-2 border-slate-200" />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={assignAll}
              onChange={(e) => setAssignAll(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
            />
            <span className="text-sm font-medium text-slate-700">Assign to All</span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" isLoading={loading}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
