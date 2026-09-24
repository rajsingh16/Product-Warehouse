import { Eye, EyeOff, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Layout } from '../components/layout/Layout';
import { Pagination } from '../components/common/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../data/mockData';
import { employeeService } from '../services/employeeService';
import type { Employee, EmployeeStatus } from '../types';
import { can } from '../utils/authorization';

type EmployeeFormState = {
  employeeId: string;
  name: string;
  designation: string;
  mobileNumber: string;
  email: string;
  dateOfJoining: string;
  status: EmployeeStatus;
  password: string;
  confirmPassword: string;
};

const emptyForm: EmployeeFormState = {
  employeeId: '',
  name: '',
  designation: '',
  mobileNumber: '',
  email: '',
  dateOfJoining: '',
  status: 'active',
  password: '',
  confirmPassword: '',
};

const MIN_PASSWORD_LENGTH = 8;

/** Returns an error message, or '' when the password is acceptable. */
function validatePassword(password: string, confirmPassword: string, isRequired: boolean): string {
  if (!password && !confirmPassword) {
    return isRequired ? 'Password is required.' : '';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return '';
}

export function Employees() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ employeeId: '', name: '', designation: '', mobileNumber: '', email: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadEmployees = async () => {
    try { setLoadError(''); setEmployees(await employeeService.getEmployees()); }
    catch (err) { setLoadError(err instanceof Error ? err.message : 'Failed to load employees.'); }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const visibleEmployees = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesQuery =
        !q ||
        [employee.employeeId, employee.name,employee.designation, employee.mobileNumber, employee.email, employee.status].some((value) =>
          value.toLowerCase().includes(q),
        );
      const matchesFilters =
        (!filters.employeeId || employee.employeeId.toLowerCase().includes(filters.employeeId.toLowerCase())) &&
        (!filters.name || employee.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.designation || employee.designation.toLowerCase().includes(filters.designation.toLowerCase())) &&
        (!filters.mobileNumber || employee.mobileNumber.toLowerCase().includes(filters.mobileNumber.toLowerCase())) &&
        (!filters.email || employee.email.toLowerCase().includes(filters.email.toLowerCase())) &&
        (!filters.status || employee.status === filters.status);
      return matchesQuery && matchesFilters;
    });
  }, [employees, filters, query]);

  useEffect(() => { setPage(1); }, [query, filters]);
  const paginatedEmployees = visibleEmployees.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowPassword(false);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({
      employeeId: employee.employeeId,
      name: employee.name,
      designation: employee.designation || '',
      mobileNumber: employee.mobileNumber,
      email: employee.email,
      dateOfJoining: employee.dateOfJoining,
      status: employee.status,
      password: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setShowPassword(false);
  };

  const saveEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.name ||!form.designation || !form.mobileNumber || !form.email || !form.dateOfJoining) {
      setError('All fields are required.');
      return;
    }

    if (!editing) {
      const passwordError = validatePassword(
        form.password,
        form.confirmPassword,
        true
      );
    
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    const { confirmPassword: _confirmPassword, password, ...details } = form;

    try {
      if (editing) {
        await employeeService.updateEmployee(editing.id, { ...details });
        showToast('Employee updated successfully.');
      } else {
        await employeeService.createEmployee({ ...details, password });
        showToast('Employee created successfully.');
      }
      closeModal();
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee.');
    }
  };

  const deleteEmployee = async () => {
    if (!deleting) return;
    await employeeService.deleteEmployee(deleting.id);
    showToast('Employee deleted successfully.');
    setDeleting(null);
    await loadEmployees();
  };

  return (
    <Layout breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: 'Employee List' }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Employee List</h1>
        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row xl:flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees..." className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" />
            </div>
            <div className="relative">
              <Button variant="secondary" onClick={() => setFilterOpen((open) => !open)}>
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              {filterOpen && (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-slate-900/50"
      onClick={() => setFilterOpen(false)}
      aria-hidden
    />

    {/* Filter Modal */}
    <div className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
      
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
          Filter Employees
        </h2>

        <button
          type="button"
          onClick={() => setFilterOpen(false)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          aria-label="Close filters"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Fields */}
      <div className="grid gap-3 sm:grid-cols-2">

        <input
          value={filters.employeeId}
          onChange={(e) =>
            setFilters((current) => ({
              ...current,
              employeeId: e.target.value,
            }))
          }
          placeholder="Employee ID"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          value={filters.name}
          onChange={(e) =>
            setFilters((current) => ({
              ...current,
              name: e.target.value,
            }))
          }
          placeholder="Name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={filters.designation}
          onChange={(e) =>
            setFilters((current) => ({
              ...current,
              designation: e.target.value,
            }))
          }
          placeholder="Designation"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          value={filters.mobileNumber}
          onChange={(e) =>
            setFilters((current) => ({
              ...current,
              mobileNumber: e.target.value,
            }))
          }
          placeholder="Mobile Number"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          type="email"
          value={filters.email}
          onChange={(e) =>
            setFilters((current) => ({
              ...current,
              email: e.target.value,
            }))
          }
          placeholder="Email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

      </div>

      {/* Status */}
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-slate-700">
          Status
        </legend>

        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
            <input
              type="radio"
              name="employee-status"
              checked={filters.status === ''}
              onChange={() =>
                setFilters((current) => ({
                  ...current,
                  status: '',
                }))
              }
            />
            All
          </label>

          <label className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
            <input
              type="radio"
              name="employee-status"
              checked={filters.status === 'active'}
              onChange={() =>
                setFilters((current) => ({
                  ...current,
                  status: 'active',
                }))
              }
            />
            Active
          </label>

          <label className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
            <input
              type="radio"
              name="employee-status"
              checked={filters.status === 'inactive'}
              onChange={() =>
                setFilters((current) => ({
                  ...current,
                  status: 'inactive',
                }))
              }
            />
            Inactive
          </label>
        </div>
      </fieldset>

      {/* Footer */}
      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setFilters({
              employeeId: '',
              name: '',
              designation: '',
              mobileNumber: '',
              email: '',
              status: '',
            })
          }
        >
          Clear
        </Button>

        <Button
          type="button"
          onClick={() => setFilterOpen(false)}
        >
          Apply Filters
        </Button>
      </div>

    </div>
  </div>
)}
            </div>
          </div>
          {can(user, 'employees:create') && (
            <Button onClick={openCreate} className="w-full shrink-0 sm:w-auto">
              <Plus className="h-4 w-4" />
              New Employee
            </Button>
          )}
        </div>
      </div>

      {loadError && 
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>}
      {/* =========================================================
    EMPLOYEE TABLE / MOBILE VIEW
    ========================================================= */}

<div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">

{/* =======================================================
    DESKTOP / TABLET VIEW
    ======================================================= */}
<div className="hidden min-w-0 md:block">

  {/* Scrollable table area */}
  <div className="max-h-[calc(100vh-22rem)] min-w-0 overflow-auto">

    <table className="w-full min-w-[850px] text-left text-sm">

      {/* Sticky Header */}
      <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50">
        <tr>
          {[
            'Actions',
            'Emp ID',
            'Name',
            'Designation',
            'Mobile Number',
            'Email',
            'Date of Joining',
            'Status',
          ].map((column) => (
            <th
              key={column}
              className="whitespace-nowrap px-4 py-3 font-medium text-slate-600"
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>

      {/* Table Body */}
      <tbody className="divide-y divide-slate-200">

        {paginatedEmployees.length === 0 ? (
          <tr>
            <td
              colSpan={8}
              className="px-4 py-10 text-center text-sm text-slate-500"
            >
              No employees found.
            </td>
          </tr>
        ) : (
          paginatedEmployees.map((employee) => (
            <tr
              key={employee.id}
              className="hover:bg-slate-50"
            >

              {/* Actions */}
              <td className="whitespace-nowrap px-4 py-3">
                <div className="flex gap-2">

                  {can(user, 'employees:edit') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(employee)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  )}

                  {can(user, 'employees:delete') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(employee)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}

                </div>
              </td>

              {/* Employee ID */}
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {employee.employeeId}
              </td>

              {/* Name */}
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {employee.name}
              </td>
              {/* Designation */}
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {employee.designation || 'Not available'}
              </td>

              {/* Mobile */}
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {employee.mobileNumber}
              </td>

              {/* Email */}
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {employee.email}
              </td>

              {/* Date of Joining */}
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(employee.dateOfJoining)}
              </td>

              {/* Status */}
              <td className="whitespace-nowrap px-4 py-3">
                <StatusBadge status={employee.status} />
              </td>

            </tr>
          ))
        )}

      </tbody>
    </table>

  </div>
</div>


{/* =======================================================
    MOBILE VIEW
    ======================================================= */}
<div className="block md:hidden">

  {paginatedEmployees.length === 0 ? (

    <div className="px-4 py-10 text-center text-sm text-slate-500">
      No employees found.
    </div>

  ) : (

    <div className="divide-y divide-slate-200">

      {paginatedEmployees.map((employee) => (

        <div
          key={employee.id}
          className="p-4"
        >

          {/* Employee Header */}
          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0 flex-1">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Employee
              </p>

              <p className="mt-1 break-words text-base font-semibold text-slate-900">
                {employee.name}
              </p>
              <p className="mt-1 break-words text-sm text-slate-600">
                {employee.designation || 'Designation not available'}
              </p>

            </div>

            <div className="shrink-0">
              <StatusBadge status={employee.status} />
            </div>

          </div>


          {/* Employee ID */}
          <div className="mt-4">

            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Employee ID
            </p>

            <p className="mt-1 break-words text-sm font-medium text-slate-900">
              {employee.employeeId}
            </p>

          </div>


          {/* Mobile Number + Date */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Mobile Number
              </p>

              <p className="mt-1 break-words text-sm text-slate-700">
                {employee.mobileNumber || 'Not available'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Date of Joining
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(employee.dateOfJoining)}
              </p>
            </div>

          </div>


          {/* Email */}
          <div className="mt-4">

            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </p>

            <p className="mt-1 break-all text-sm text-slate-700">
              {employee.email || 'Not available'}
            </p>

          </div>


          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">

            {can(user, 'employees:edit') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openEdit(employee)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}

            {can(user, 'employees:delete') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleting(employee)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
                Delete
              </Button>
            )}

          </div>

        </div>

      ))}

    </div>

  )}

</div>


{/* =======================================================
    PAGINATION
    ======================================================= */}
<div className="border-t border-slate-200 bg-white">

  <Pagination
    page={page}
    pageSize={pageSize}
    total={visibleEmployees.length}
    onPageChange={setPage}
    onPageSizeChange={(size) => {
      setPageSize(size);
      setPage(1);
    }}
  />

</div>

</div>
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Employee' : 'New Employee'} size="lg">
        <form onSubmit={saveEmployee} className="grid gap-4 sm:grid-cols-2">
          {/* Only rendered when editing an existing employee */}
          {editing && (
            <input
              value={form.employeeId}
              disabled
              placeholder="Employee ID"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-100 cursor-not-allowed text-slate-500"
            />
          )}
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value = {form.designation} onChange={(e)=> setForm({ ...form,designation: e.target.value, })} placeholder="Designation" className ="rounded-md border border-slate-300 px-3 py-2 text-sm"/>
          <input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} placeholder="Mobile Number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {!editing && (
            <>
              <div className="sm:col-span-2 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900">Set Password</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Minimum {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm Password"
                autoComplete="new-password"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </>
          )}
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit">{editing ? 'Save Changes' : 'Create Employee'}</Button>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} title="Delete Employee?" message="Are you sure you want to delete this employee?" onConfirm={deleteEmployee} onCancel={() => setDeleting(null)} />
    </Layout>
  );
}