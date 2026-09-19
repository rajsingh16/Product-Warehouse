import { Download, Eye, FileSpreadsheet, Filter, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { taskService } from '../services/taskService';
import type { Employee, Project, Task, TaskStatus } from '../types';
import { can } from '../utils/authorization';
import { taskMasterService } from '../services/taskService';
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

  const toTaskInput = (): Omit<Task, 'id'> => {
    const employee = employees.find((item) => item.employeeId === form.employeeId);
    if (!employee) throw new Error('Assigned employee is required.');
    if (!taskMaster.some((item) => item.taskId === form.taskId)) throw new Error('Select an active Task Master record.');
    return {
      projectId: form.projectId,
      taskId: form.taskId,
      description: form.description,
      assignedTo: { employeeId: employee.employeeId, employeeName: employee.name },
      assignedOn: form.assignedOn,
      referenceLink: form.referenceUrl
          ? { kind: 'url', label: form.referenceUrl, url: form.referenceUrl }
          : undefined,
      //referenceDocument: form.referenceFile ?? undefined,
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
    Description: task.description,
    'Employee ID': task.assignedTo.employeeId,
    'Employee Name': task.assignedTo.employeeName,
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
        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm" />
            </div>
            <div className="relative">
              <Button variant="secondary" onClick={() => setFilterOpen((open) => !open)}><Filter className="h-4 w-4" />Filter</Button>
              {filterOpen && (
                <div className="absolute z-30 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                  <h2 className="mb-3 text-sm font-semibold">Filter Tasks</h2>
                  <div className="space-y-3">
                    <input value={filters.taskId} onChange={(e) => setFilters({ ...filters, taskId: e.target.value })} placeholder="Task ID" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <div className="space-y-2">
                      {statuses.map((status) => (
                        <label key={status} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={filters.statuses.includes(status)} onChange={() => setFilters((current) => ({ ...current, statuses: current.statuses.includes(status) ? current.statuses.filter((item) => item !== status) : [...current.statuses, status] }))} />
                          {status}
                        </label>
                      ))}
                    </div>
                    <input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} placeholder="Employee ID / Name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setFilters({ taskId: '', dateFrom: '', dateTo: '', statuses: [], employee: '' })}>Clear</Button>
                      <Button size="sm" onClick={() => setFilterOpen(false)}>Apply</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={downloadExcel}><FileSpreadsheet className="h-4 w-4" />Download Excel</Button>
            <Button variant="secondary" onClick={downloadCsv}><Download className="h-4 w-4" />Download CSV</Button>
            {can(user, 'tasks:create') && <Button onClick={openCreate}><Plus className="h-4 w-4" />Assign Task</Button>}
          </div>
        </div>
      </div>

      {loadError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>{['Actions', 'Project', 'Select Task', 'Description', 'Assigned To', 'Assigned On', 'Reference Link', 'Comments', 'Status'].map((column) => <th key={column} className="px-4 py-3 font-medium text-slate-600">{column}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="flex gap-2">{can(user, 'tasks:edit') && <Button variant="ghost" size="sm" onClick={() => openEdit(task)}><Pencil className="h-4 w-4" />Edit</Button>}{can(user, 'tasks:delete') && <Button variant="ghost" size="sm" onClick={() => setDeleting(task)}><Trash2 className="h-4 w-4 text-red-600" /></Button>}</div></td>
                  <td className ="px-4 py-3 text-slate-600 "> {task.projectName ?? task.projectId ?? "No Projecy"}</td>
                  <td className="px-4 py-3 text-slate-600">{task.taskId}</td>
                  <td className="px-4 py-3 text-slate-700">{task.description}</td>
                  <td className="px-4 py-3 text-slate-600">{task.assignedTo.employeeId} - {task.assignedTo.employeeName}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(task.assignedOn)}</td>
                  <td className="px-4 py-3">{task.referenceLink ? <Button variant="ghost" size="sm" onClick={() => setPreviewRef(task)}><Eye className="h-4 w-4" />Preview</Button> : <span className="text-slate-400">None</span>}</td>
                  
                  <td className="px-4 py-3 text-slate-600">{task.comments.length > 500 ? <span>{task.comments.slice(0, 500)}... <button className="font-medium text-slate-900 underline" onClick={() => setViewComment(task)}>View More</button></span> : task.comments}</td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pageSize={pageSize} total={visibleTasks.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
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
