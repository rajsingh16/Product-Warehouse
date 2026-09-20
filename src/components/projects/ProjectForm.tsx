import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { employeeService } from '../../services/employeeService';
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
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeeQuery, setEmployeeQuery] = useState('');

  useEffect(() => {
    employeeService.getEmployees().then(setEmployees).finally(() => setEmployeesLoading(false));
  }, []);

  useEffect(() => {
    if (assignAll) {
      setSelectedIds(employees.map((e) => e.id));
    }
  }, [assignAll, employees]);

  const toggleEmployee = (id: string) => {
    setAssignAll(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id],
    );
  };

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = employeeQuery.trim().toLowerCase();
    if (!normalizedQuery) return employees;
    return employees.filter((employee) =>
      `${employee.name} ${employee.id}`.toLowerCase().includes(normalizedQuery),
    );
  }, [employeeQuery, employees]);

  const selectedEmployees = employees.filter((employee) => selectedIds.includes(employee.id));

  const selectVisibleEmployees = () => {
    setAssignAll(false);
    setSelectedIds((current) => Array.from(new Set([...current, ...filteredEmployees.map((employee) => employee.id)])));
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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-5">
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

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">Assign Employees</p>
          <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
        </div>

        {selectedEmployees.length > 0 && (
          <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
            {selectedEmployees.map((employee) => (
              <span key={employee.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-700">
                <span className="truncate">{employee.name}</span>
                <button type="button" onClick={() => toggleEmployee(employee.id)} className="shrink-0 rounded-full p-0.5 hover:bg-slate-300" aria-label={`Remove ${employee.name}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="rounded-md border border-slate-200">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={employeeQuery} onChange={(event) => setEmployeeQuery(event.target.value)} placeholder="Search by name or employee ID" className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" />
            </div>
            <button type="button" onClick={selectVisibleEmployees} disabled={filteredEmployees.length === 0} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Select visible
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto p-2 sm:max-h-56">
            {employeesLoading ? (
              <p className="px-2 py-3 text-sm text-slate-500">Loading employees...</p>
            ) : filteredEmployees.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500">No employees found.</p>
            ) : filteredEmployees.map((employee) => (
              <label key={employee.id} className="flex min-w-0 cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50">
                <input type="checkbox" checked={selectedIds.includes(employee.id)} onChange={() => toggleEmployee(employee.id)} className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-800 focus:ring-slate-500" />
                <span className="min-w-0 truncate text-sm text-slate-700">{employee.name}</span>
                <span className="ml-auto shrink-0 text-xs text-slate-400">{employee.id}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={assignAll} onChange={(event) => setAssignAll(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500" />
              Assign to all employees
            </label>
            {selectedIds.length > 0 && <button type="button" onClick={() => { setAssignAll(false); setSelectedIds([]); }} className="text-xs font-medium text-slate-500 hover:text-slate-800">Clear selection</button>}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row">
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
