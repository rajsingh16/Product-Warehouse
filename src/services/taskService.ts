import { apiRequest, queryString } from './apiClient';
import type { Task, TaskStatus } from '../types';

type ApiTask = { id: number; task_id: number; project_id : string | null; project_name: string | null; description: string; status: TaskStatus; reference_link: string | null; reference_document: string | null; assigned_to: string | null; assigned_on: string | null };
function mapTask(task: ApiTask): Task { return { id: String(task.id), taskId: String(task.task_id),
projectId: task.project_id ?? undefined, projectName:task.project_name ?? undefined, description: task.description, assignedTo: { employeeId: task.assigned_to ?? '', employeeName: task.assigned_to ?? 'Unassigned' }, assignedOn: task.assigned_on ?? '', referenceLink: task.reference_link ? { kind: 'url', label: task.reference_link, url: task.reference_link } : undefined, comments: '', status: task.status }; }

type TaskInput = Omit<Task, 'id'> & { projectId?: string };
export const taskService = {
  async getTasks() { return (await apiRequest<ApiTask[]>('/api/tasks?page=1&pageSize=100')).map(mapTask); },
  async createTask(input: TaskInput) {
    const created = await apiRequest<ApiTask>('/api/tasks', { method: 'POST', body: JSON.stringify({ taskId: input.taskId,projectId: input.projectId, description: input.description, status: input.status, referenceLink: input.referenceLink?.url ?? null, assignedTo: input.assignedTo.employeeId, assignedOn: input.assignedOn }) });
    return mapTask(created);
  },
  async updateTask(id: string, input: TaskInput) {
    const updated = await apiRequest<ApiTask>(`/api/tasks/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ taskId: input.taskId,projectId: input.projectId, description: input.description, status: input.status, referenceLink: input.referenceLink?.url ?? null, assignedTo: input.assignedTo.employeeId, assignedOn: input.assignedOn }) });
    return mapTask(updated);
  },
  async deleteTask(id: string) { await apiRequest(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
};

export const taskMasterService = {
  async getActive(search = '') { const tasks = await apiRequest<Array<{ task_id: number; task_name: string; status: string }>>(`/api/task-master/active${queryString({ search, page: 1, pageSize: 100 })}`); return tasks.map((task) => ({ taskId: String(task.task_id), taskName: task.task_name, status: 'Active' })); },
  async getAll() { const tasks = await apiRequest<Array<{ task_id: number; task_name: string; status: string }>>('/api/task-master?includeInactive=true&page=1&pageSize=100'); return tasks.map((task) => ({ taskId: String(task.task_id), taskName: task.task_name, status: task.status === 'A' ? 'Active' : 'Inactive' })); },
  async create(input: { taskId: string; taskName: string; status: string }) { return apiRequest<{ task_id: number; task_name: string; status: string }>('/api/task-master', { method: 'POST', body: JSON.stringify({ taskName: input.taskName, status: input.status }) }); },
  async update(taskId: string, input: { taskName: string; status: string }) { return apiRequest<{ task_id: number; task_name: string; status: string }>(`/api/task-master/${encodeURIComponent(taskId)}`, { method: 'PUT', body: JSON.stringify({ taskName: input.taskName, status: input.status }) }); },
  async delete(taskId: string) { await apiRequest(`/api/task-master/${encodeURIComponent(taskId)}`, { method: 'DELETE' }); },
};
