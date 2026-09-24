import { Download, Eye, FileSpreadsheet, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../data/mockData';
import { employeeService } from '../services/employeeService';
import { taskService, taskMasterService } from '../services/taskService';
import type { Employee, Project, Task, TaskStatus } from '../types';
import { can } from '../utils/authorization';
import type  { TaskInput  } from '../services/taskService';
import { projectService } from '../services/projectService';
const statuses: TaskStatus[] = ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled', '25% progress complete', '50% progress complete', '75% progress complete'];

type TaskFormState = {
  projectId: string;
  taskId: string;
  description: string;
  employeeId: string;
  assignedOn: string;
  referenceUrl: string;
  //referenceFile: ProjectFile | null;
  comments: string;
  status: TaskStatus;
};

const emptyForm: TaskFormState = {
  projectId: '',
  taskId: '',
  description: '',
  employeeId: '',
  assignedOn: '',
  referenceUrl: '',
  //referenceFile: null,
  comments: '',
  status: 'Pending',
};
const formatTaskOption = (taskName: string, taskId: string) => {
  const maxLength = 45;

  const shortName =
    taskName.length > maxLength
      ? `${taskName.substring(0, maxLength)}...`
      : taskName;

  return `${shortName} (${taskId})`;
};

export function Tasks() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [taskMaster, setTaskMaster] = useState<Array<{ taskId: string; taskName: string }>>([]);
  const [projects, setProjects] = useState<Project[]>([]);  
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ taskId: '', dateFrom: '', dateTo: '', statuses: [] as TaskStatus[], employee: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [viewComment, setViewComment] = useState<Task | null>(null);
  const [previewRef, setPreviewRef] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    try {
      setLoadError('');
      const [taskData, employeeData, taskMasterData, projectData] = await Promise.all([taskService.getTasks(), employeeService.getEmployees(), taskMasterService.getActive(),
projectService.getProjects(),
]);
      setTasks(taskData); setEmployees(employeeData); setTaskMaster(taskMasterData); setProjects(projectData);
    } catch (err) { setLoadError(err instanceof Error ? err.message : 'Failed to load task data.'); }
  };

  useEffect(() => {
    loadData();
  }, []);

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery =
        !q ||
        [task.taskId, task.description, task.assignedTo.employeeId, task.assignedTo.employeeName].some((value) =>
          value.toLowerCase().includes(q),
        );
      const assignedTime = new Date(task.assignedOn).getTime();
      const matchesFilter =
        (!filters.taskId || task.taskId.toLowerCase().includes(filters.taskId.toLowerCase())) &&
        (!filters.dateFrom || assignedTime >= new Date(filters.dateFrom).getTime()) &&
        (!filters.dateTo || assignedTime <= new Date(filters.dateTo).getTime()) &&
        (filters.statuses.length === 0 || filters.statuses.includes(task.status)) &&
        (!filters.employee ||
          `${task.assignedTo.employeeId} ${task.assignedTo.employeeName}`.toLowerCase().includes(filters.employee.toLowerCase()));
      return matchesQuery && matchesFilter;
    });
  }, [filters, query, tasks]);

  useEffect(() => { setPage(1); }, [query, filters]);
  const paginatedTasks = visibleTasks.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({
      projectId: task.projectId ?? '',
      taskId: task.taskId,
      description: task.description,
      employeeId: task.assignedTo.employeeId,
      assignedOn: task.assignedOn,
      referenceUrl: task.referenceLink?.kind === 'url' ? task.referenceLink.url ?? '' : '',
      //referenceFile: task.referenceDocument ?? null,
      comments: task.comments,
      status: task.status,
    });
    setError('');
    setModalOpen(true);
  };

  const toTaskInput = (): TaskInput => {
    const employee = employees.find(
      (item) => item.employeeId === form.employeeId
    );
  
    if (!employee) {
      throw new Error('Assigned employee is required.');
    }
  
    if (!taskMaster.some((item) => item.taskId === form.taskId)) {
      throw new Error('Select an active Task Master record.');
    }
  
    return {
      projectId: form.projectId,
  
      taskId: form.taskId,
  
      description: form.description,
  
      assignedTo: {
        employeeId: employee.employeeId,
        employeeName: employee.name,
      },
  
      assignedOn: form.assignedOn,
  
      referenceLink: form.referenceUrl
        ? {
            kind: 'url',
            label: form.referenceUrl,
            url: form.referenceUrl,
          }
        : undefined,
  
      comments: form.comments,
  
      status: form.status,
    };
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const input = toTaskInput();
      if (editing) {
        await taskService.updateTask(editing.id, input);
        showToast('Task updated successfully.');
      } else {
        await taskService.createTask(input);
        showToast('Task created successfully.');
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task.');
    }
  };

  const exportRows = visibleTasks.map((task) => ({
    Project: task.projectName ?? '',
    'Task ID': task.taskId,
    'Task Name': task.taskName,
    Description: task.description,
    'Assigned To ID': task.assignedTo.employeeId,
    'Assigned To Name': task.assignedTo.employeeName,
    'Assigned By ID': task.assignedBy.employeeId,
    'Assigned By Name': task.assignedBy.employeeName,
    'Assigned On': task.assignedOn,
    'Reference Link': task.referenceLink?.url ?? task.referenceLink?.label ?? '',
    Comments: task.comments,
    Status: task.status,
  }));

  const downloadCsv = () => {
    const headers = Object.keys(exportRows[0] ?? { 'Task ID': '', Description: '', 'Employee ID': '', 'Employee Name': '', 'Assigned On': '', 'Reference Link': '', Comments: '', Status: '' });
    const csv = [headers.join(','), ...exportRows.map((row) => headers.map((header) => `"${String(row[header as keyof typeof row] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    XLSX.writeFile(workbook, 'tasks.xlsx');
  };

  const deleteTask = async () => {
    if (!deleting) return;
    await taskService.deleteTask(deleting.id);
    showToast('Task deleted successfully.');
    setDeleting(null);
    await loadData();
  };

  return (
    <Layout breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: 'Task' }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
  {/* Search + Filter */}
  <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row">
    <div className="relative w-full sm:max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </div>

    <div className="relative w-full sm:w-auto">
      <Button
        type = "button"
        variant="secondary"
        onClick={() => setFilterOpen((open) => !open)}
        className="w-full sm:w-auto"
        aria-expanded={filterOpen}
      >
        <Filter className="h-4 w-4" />
        Filter
      </Button>

      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setFilterOpen(false)} aria-hidden />
          <div className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Filter Tasks</h2>
              <button type="button" onClick={() => setFilterOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={filters.taskId} onChange={(e) => setFilters((current) => ({ ...current, taskId: e.target.value }))} placeholder="Task ID" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input value={filters.employee} onChange={(e) => setFilters((current) => ({ ...current, employee: e.target.value }))} placeholder="Employee ID or name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <label className="text-sm text-slate-600">Date from<input type="date" value={filters.dateFrom} onChange={(e) => setFilters((current) => ({ ...current, dateFrom: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
              <label className="text-sm text-slate-600">Date to<input type="date" value={filters.dateTo} onChange={(e) => setFilters((current) => ({ ...current, dateTo: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
            </div>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-medium text-slate-700">Status</legend>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <label key={status} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
                    <input type="checkbox" checked={filters.statuses.includes(status)} onChange={(e) => setFilters((current) => ({ ...current, statuses: e.target.checked ? [...current.statuses, status] : current.statuses.filter((value) => value !== status) }))} />
                    {status}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
              <Button type="button" variant="secondary" onClick={() => setFilters({ taskId: '', dateFrom: '', dateTo: '', statuses: [], employee: '' })}>Clear</Button>
              <Button type="button" onClick={() => setFilterOpen(false)}>Apply Filters</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Action buttons */}
  <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
    <Button
      variant="secondary"
      onClick={downloadExcel}
      className="w-full sm:w-auto"
    >
      <FileSpreadsheet className="h-4 w-4" />
      Download Excel
    </Button>

    <Button
      variant="secondary"
      onClick={downloadCsv}
      className="w-full sm:w-auto"
    >
      <Download className="h-4 w-4" />
      Download CSV
    </Button>

    {can(user, 'tasks:create') && (
      <Button
        onClick={openCreate}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        Assign Task
      </Button>
    )}
  </div>
</div>
</div>
{loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* =========================================================
          RESPONSIVE CONTAINER (DESKTOP + MOBILE VIEWS)
          ========================================================= */}
      <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">

        {/* DESKTOP / TABLET VIEW */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="max-h-[calc(100vh-22rem)] overflow-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                <tr>
                  {[
                    'Actions',
                    'Project',
                    'Select Task',
                    'Description',
                    'Assigned To',
                    'Assigned By',
                    'Assigned On',
                    'Reference Link',
                    'Comments',
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

              <tbody className="divide-y divide-slate-200">
                {paginatedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50"
                  >
                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        {can(user, 'tasks:edit') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(task)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                        )}

                        {can(user, 'tasks:delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleting(task)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-4 py-3 text-slate-600">
                      {task.projectName ?? task.projectId ?? 'No Project'}
                    </td>

                    {/* Task */}
                    <td className="px-4 py-3 text-slate-600">
                      {task.taskId} -{task.taskName}
                    </td>

                    {/* Description */}
                    <td className="max-w-[300px] px-4 py-3 text-slate-700">
                      <div className="break-words">
                        {task.description}
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {task.assignedTo.employeeId && task.assignedTo.employeeName
                        ? `${task.assignedTo.employeeId} - ${task.assignedTo.employeeName}`
                        : task.assignedTo.employeeId || 'Unassigned'}
                    </td>
                    {/* Assigned By */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {task.assignedBy.employeeId && task.assignedBy.employeeName
                        ? `${task.assignedBy.employeeId} - ${task.assignedBy.employeeName}`
                        : task.assignedBy.employeeId || 'Not available'}
                    </td>

                    {/* Assigned On */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(task.assignedOn)}
                    </td>

                    {/* Reference Link */}
                    <td className="px-4 py-3">
                      {task.referenceLink ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewRef(task)}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      ) : (
                        <span className="text-slate-400">
                          None
                        </span>
                      )}
                    </td>

                    {/* Comments */}
                    <td className="max-w-[300px] px-4 py-3 text-slate-600">
                      {(task.comments ?? '').length > 500 ? (
                        <span>
                          {task.comments.slice(0, 500)}...
                          <button
                            className="ml-1 font-medium text-slate-900 underline"
                            onClick={() => setViewComment(task)}
                          >
                            View More
                          </button>
                        </span>
                      ) : (
                        task.comments
                      )}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE VIEW */}
        <div className="block md:hidden">
          {paginatedTasks.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No tasks found.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {paginatedTasks.map((task) => (
                <div key={task.id} className="p-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Project
                      </p>
                      <p className="mt-1 break-words text-base font-semibold text-slate-900">
                        {task.projectName ?? task.projectId ?? 'No Project'}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  {/* Task ID */}
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Task
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {task.taskId} - {task.taskName}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Description
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-700">
                      {task.description}
                    </p>
                  </div>

                  {/* Assigned To + Date */}
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Assigned To
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-700">
                        {task.assignedTo.employeeId && task.assignedTo.employeeName
                          ? `${task.assignedTo.employeeId} - ${task.assignedTo.employeeName}`
                          : task.assignedTo.employeeId || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Assigned By
                      </p>

                      <p className="mt-1 break-words text-sm text-slate-700">
                        {task.assignedBy.employeeId && task.assignedBy.employeeName
                          ? `${task.assignedBy.employeeId} - ${task.assignedBy.employeeName}`
                          : task.assignedBy.employeeId || 'Not available'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Assigned On
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(task.assignedOn)}
                      </p>
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Reference Link
                    </p>
                    <div className="mt-1">
                      {task.referenceLink ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewRef(task)}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-400">None</span>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Comments
                    </p>
                    <div className="mt-1 break-words text-sm text-slate-700">
                      {task.comments.length > 250 ? (
                        <>
                          {task.comments.slice(0, 250)}...
                          <button
                            className="ml-1 font-medium text-slate-900 underline"
                            onClick={() => setViewComment(task)}
                          >
                            View More
                          </button>
                        </>
                      ) : (
                        task.comments || 'No comments'
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {can(user, 'tasks:edit') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(task)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    )}

                    {can(user, 'tasks:delete') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(task)}
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
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={visibleTasks.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Task' : 'Assign Task'} size="xl">
        <form onSubmit={saveTask} className="grid gap-4 sm:grid-cols-2">
        <select value= {form.projectId} onChange={(e) => setForm ({...form,projectId: e.target.value,})}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        required>
        <option value="">Select Project</option>
        { projects .filter((project) =>project.status !='Inactive').map((project) => (<option key ={project.id} value ={project.id}>
        {project.name}</option>))} </select>
        <div>
          <select
            value={form.taskId}
            onChange={(e) =>
              setForm({ ...form, taskId: e.target.value })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            required
          >
            <option value="">Select Task</option>

            {taskMaster.map((task) => (
              <option key={task.taskId} value={task.taskId}>
                {formatTaskOption(task.taskName, task.taskId)}
              </option>
            ))}
          </select>
        </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Assigned To</option>
            {employees.map((employee) => <option key={employee.id} value={employee.employeeId}>{employee.name} ({employee.employeeId})</option>)}
          </select>
          <input type="date" value={form.assignedOn} onChange={(e) => setForm({ ...form, assignedOn: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={form.referenceUrl} onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })} placeholder="Reference URL" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          
          <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} placeholder="Comments" className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2"><Button type="submit">{editing ? 'Save Changes' : 'Create Task'}</Button><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button></div>
        </form>
      </Modal>

      <Modal isOpen={!!viewComment} onClose={() => setViewComment(null)} title="Task Comment" size="lg"><p className="whitespace-pre-wrap text-sm text-slate-700">{viewComment?.comments}</p></Modal>
       <Modal isOpen={!!previewRef} onClose={() => setPreviewRef(null)} title="Reference Preview" size="xl">
       {previewRef?.referenceLink?.kind === 'url' && (
    <a
      className="text-sm font-medium text-slate-900 underline"
      href={previewRef.referenceLink.url}
      target="_blank"
      rel="noreferrer"
    >
      Open URL
    </a>
  )}
</Modal>
      <ConfirmDialog isOpen={!!deleting} title="Delete Task?" message="Are you sure you want to delete this task?" onConfirm={deleteTask} onCancel={() => setDeleting(null)} />
    </Layout>
  );
}
