import { Filter, Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { employeeService } from '../services/employeeService';
import { availableRoles, availableRoleIds, dedupeRoles, roleService } from '../services/roleService';
import type { Employee, EmployeeStatus, RoleDefinition, RoleId, UserRoleAssignment } from '../types';
import { can } from '../utils/authorization';

type RoleFormState = {
  employeeId: string;
  roles: RoleId[];
  status: EmployeeStatus;
};

const roleTone: Record<RoleDefinition['group'], string> = {
  Project: 'border-sky-200 bg-sky-50 text-sky-800',
  Employee: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  User: 'border-violet-200 bg-violet-50 text-violet-800',
  Task: 'border-amber-200 bg-amber-50 text-amber-800',
};

const roleById = new Map(availableRoles.map((role) => [role.id, role]));

function RoleBadges({ roles }: { roles: RoleId[] }) {
  const visibleRoles = roles.slice(0, 4);
  const remaining = roles.length - visibleRoles.length;

  if (roles.length === 0) return <span className="text-slate-400">No roles assigned</span>;

  return (
    <div className="flex max-w-xl flex-wrap gap-1.5">
      {visibleRoles.map((roleId) => {
        const role = roleById.get(roleId);
        if (!role) return null;
        return (
          <span key={roleId} className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${roleTone[role.group]}`}>
            {role.label}
          </span>
        );
      })}
      {remaining > 0 && (
        <span title={roles.map((roleId) => roleById.get(roleId)?.label ?? roleId).join(', ')} className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

export function UserRole() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ employeeId: '', role: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRoleAssignment | null>(null);
  const [form, setForm] = useState<RoleFormState>({ employeeId: '', roles: [], status: 'active' });
  const [error, setError] = useState('');

  const loadData = async () => {
    const [roleData, employeeData] = await Promise.all([roleService.getAssignments(), employeeService.getEmployees()]);
    setAssignments(roleData);
    setEmployees(employeeData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const visibleAssignments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const matchesQuery = !q || [assignment.employeeId, assignment.employeeName].some((value) => value.toLowerCase().includes(q));
      const matchesFilters =
        (!filters.employeeId || assignment.employeeId.toLowerCase().includes(filters.employeeId.toLowerCase())) &&
        (!filters.role || assignment.roles.includes(filters.role as RoleId));
      return matchesQuery && matchesFilters;
    });
  }, [assignments, filters, query]);

  const openAssign = () => {
    setEditing(null);
    setForm({ employeeId: '', roles: [], status: 'active' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (assignment: UserRoleAssignment) => {
    setEditing(assignment);
    setForm({ employeeId: assignment.employeeId, roles: assignment.roles, status: assignment.status });
    setError('');
    setModalOpen(true);
  };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const employee = employees.find((item) => item.employeeId === form.employeeId);
    if (!employee) {
      setError('Employee is required.');
      return;
    }
    const payload = { employeeId: employee.employeeId, employeeName: employee.name, roles: dedupeRoles(form.roles), status: form.status };
    if (editing) {
      await roleService.updateAssignment(editing.id, payload);
      showToast('User roles updated successfully.');
    } else {
      await roleService.assignRole(payload);
      showToast('Roles assigned successfully.');
    }
    setModalOpen(false);
    await loadData();
  };

  const toggleRole = (role: RoleId) => {
    setForm((current) => ({
      ...current,
      roles: current.roles.includes(role) ? current.roles.filter((item) => item !== role) : dedupeRoles([...current.roles, role]),
    }));
  };

  const groupedRoles = availableRoles.reduce<Record<RoleDefinition['group'], RoleDefinition[]>>(
    (groups, role) => ({ ...groups, [role.group]: [...groups[role.group], role] }),
    { Project: [], Employee: [], User: [], Task: [] },
  );

  return (
    <Layout breadcrumbs={[{ label: 'User Role Management', path: '/user-role' }]} title="User Role Management">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-slate-900">User Role Management</h1>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees..." className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm" />
            </div>
            <div className="relative">
              <Button variant="secondary" onClick={() => setFilterOpen((open) => !open)}><Filter className="h-4 w-4" />Filter</Button>
              {filterOpen && (
                <div className="absolute z-30 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                  <h2 className="mb-3 text-sm font-semibold">Filter</h2>
                  <div className="space-y-3">
                    <input value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })} placeholder="Employee ID" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                      <option value="">All Roles</option>
                      {availableRoles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                    </select>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setFilters({ employeeId: '', role: '' })}>Clear</Button>
                      <Button size="sm" onClick={() => setFilterOpen(false)}>Apply</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {can(user, 'roles:assign') && <Button onClick={openAssign}><Plus className="h-4 w-4" />Assign Roles</Button>}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="h-full overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
              <tr>{['Actions', 'Employee ID', 'Employee Name', 'Role', 'Status'].map((column) => <th key={column} className="px-4 py-3 font-medium text-slate-600">{column}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{can(user, 'roles:assign') && <Button variant="ghost" size="sm" onClick={() => openEdit(assignment)}><Pencil className="h-4 w-4" />Edit</Button>}</td>
                  <td className="px-4 py-3 text-slate-600">{assignment.employeeId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{assignment.employeeName}</td>
                  <td className="px-4 py-3 text-slate-600"><RoleBadges roles={assignment.roles} /></td>
                  <td className="px-4 py-3"><StatusBadge status={assignment.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Roles' : 'Assign Roles'} size="lg">
        <form onSubmit={saveRole} className="space-y-4">
          <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select Employee</option>
            {employees.map((employee) => <option key={employee.id} value={employee.employeeId}>{employee.employeeId} - {employee.name}</option>)}
          </select>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Roles</p>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setForm((current) => ({ ...current, roles: availableRoleIds }))}>Select All</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setForm((current) => ({ ...current, roles: [] }))}>Clear All</Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(groupedRoles).map(([group, roles]) => (
                <fieldset key={group} className="space-y-2">
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</legend>
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.roles.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-800"
                      />
                      {role.label}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </div>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3"><Button type="submit">{editing ? 'Save Changes' : 'Assign Roles'}</Button><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button></div>
        </form>
      </Modal>
    </Layout>
  );
}
