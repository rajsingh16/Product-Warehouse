import { apiRequest, queryString } from './apiClient';
import type { Task, TaskStatus } from '../types';

type ApiTask = { task_id: string; project_id: string; description: string; status: TaskStatus; reference_link: string | null; reference_document: string | null; created_at: string; users: Array<{ userId: string; employeeId?: string; employeeName?: string; assignedOn: string }> };
function mapTask(task: ApiTask): Task { const assignment = task.users?.[0]; const referenceDocument = task.reference_document ? { id: `document-${task.task_id}`, name: task.reference_document, type: task.reference_document.split('.').pop() ?? 'file', size: 0, uploadedBy: '', uploadedAt: task.created_at } : undefined; return { id: task.task_id, taskId: task.task_id, projectId: task.project_id, description: task.description, assignedTo: { employeeId: assignment?.employeeId ?? assignment?.userId ?? '', employeeName: assignment?.employeeName ?? assignment?.userId ?? 'Unassigned' }, assignedOn: assignment?.assignedOn ?? task.created_at, referenceLink: task.reference_link ? { kind: 'url', label: task.reference_link, url: task.reference_link } : undefined, referenceDocument, comments: '', status: task.status }; }

type TaskInput = Omit<Task, 'id'> & { projectId?: string };
export const taskService = {
  async getTasks() { return (await apiRequest<ApiTask[]>('/api/tasks?page=1&pageSize=100')).map(mapTask); },
  async createTask(input: TaskInput) {
    if (!input.projectId) throw new Error('Project is required.');
    const created = await apiRequest<ApiTask>('/api/tasks', { method: 'POST', body: JSON.stringify({ taskId: input.taskId, projectId: input.projectId, description: input.description, status: input.status, referenceLink: input.referenceLink?.url ?? null, referenceDocument: input.referenceDocument?.name ?? null }) });
    if (input.assignedTo.employeeId) await apiRequest(`/api/tasks/${encodeURIComponent(input.taskId)}/users`, { method: 'POST', body: JSON.stringify({ userId: input.assignedTo.employeeId, assignedOn: input.assignedOn }) });
    return mapTask({ ...created, users: [{ userId: input.assignedTo.employeeId, assignedOn: input.assignedOn }] });
  },
  async updateTask(id: string, input: TaskInput) {
    if (!input.projectId) throw new Error('Project is required.');
    const updated = await apiRequest<ApiTask>(`/api/tasks/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ taskId: id, projectId: input.projectId, description: input.description, status: input.status, referenceLink: input.referenceLink?.url ?? null, referenceDocument: input.referenceDocument?.name ?? null }) });
    const assignments = await apiRequest<Array<{ user_id: string }>>(`/api/tasks/${encodeURIComponent(id)}/users`);
    await Promise.all(assignments.filter((assignment) => assignment.user_id !== input.assignedTo.employeeId).map((assignment) => apiRequest(`/api/tasks/${id}/users/${encodeURIComponent(assignment.user_id)}`, { method: 'DELETE' })));
    if (input.assignedTo.employeeId && assignments.every((assignment) => assignment.user_id !== input.assignedTo.employeeId)) await apiRequest(`/api/tasks/${id}/users`, { method: 'POST', body: JSON.stringify({ userId: input.assignedTo.employeeId, assignedOn: input.assignedOn }) });
    return mapTask({ ...updated, users: [{ userId: input.assignedTo.employeeId, assignedOn: input.assignedOn }] });
  },
  async deleteTask(id: string) { await apiRequest(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
};

export const taskMasterService = {
  async getActive(search = '') { const tasks = await apiRequest<Array<{ task_id: string; task_name: string; status: string }>>(`/api/task-master/active${queryString({ search, page: 1, pageSize: 100 })}`); return tasks.map((task) => ({ taskId: task.task_id, taskName: task.task_name, status: task.status })); },
  async getAll() { const tasks = await apiRequest<Array<{ task_id: string; task_name: string; status: string }>>('/api/task-master?includeInactive=true&page=1&pageSize=100'); return tasks.map((task) => ({ taskId: task.task_id, taskName: task.task_name, status: task.status })); },
  async create(input: { taskId: string; taskName: string; status: string }) { return apiRequest<{ task_id: string; task_name: string; status: string }>('/api/task-master', { method: 'POST', body: JSON.stringify({ taskId: input.taskId, taskName: input.taskName, status: input.status }) }); },
  async update(taskId: string, input: { taskName: string; status: string }) { return apiRequest<{ task_id: string; task_name: string; status: string }>(`/api/task-master/${encodeURIComponent(taskId)}`, { method: 'PUT', body: JSON.stringify({ taskId, taskName: input.taskName, status: input.status }) }); },
  async delete(taskId: string) { await apiRequest(`/api/task-master/${encodeURIComponent(taskId)}`, { method: 'DELETE' }); },
};
