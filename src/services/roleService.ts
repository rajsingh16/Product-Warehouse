import { apiRequest, queryString } from './apiClient';
import type { RoleDefinition, RoleId, UserRoleAssignment } from '../types';

export const availableRoles: RoleDefinition[] = [
  { id: 'project_view', label: 'Project View', group: 'Project' }, { id: 'project_create', label: 'Project Create', group: 'Project' },{ id: 'project_delete', label: 'Project Delete', group: 'Project' },
  { id: 'document_view', label: 'Document View', group: 'Document' },{ id: 'document_upload', label: 'Document upload', group: 'Document' },{ id: 'document_delete', label: 'Document delete', group: 'Document' },
  { id: 'employee_view', label: 'Employee View', group: 'Employee' }, { id: 'employee_create', label: 'Employee Create', group: 'Employee' },
  { id: 'user_view', label: 'User View', group: 'User' }, { id: 'user_create', label: 'User Create', group: 'User' }, { id: 'user_assign', label: 'User Assign', group: 'User' },
  { id: 'task_view', label: 'Task View', group: 'Task' },{ id: 'task_view_all', label: 'Task View All', group: 'Task' }, { id: 'task_create', label: 'Task Create', group: 'Task' }, { id: 'task_edit', label: 'Task Edit', group: 'Task' }, { id: 'task_delete', label: 'Task Delete', group: 'Task' },
];
export const availableRoleIds = availableRoles.map((role) => role.id);
export function dedupeRoles(roles: RoleId[]) { return [...new Set(roles)].filter((role): role is RoleId => availableRoleIds.includes(role)); }

export const roleService = {
  async getAssignments() {
    const users = await apiRequest<Array<{ user_id: string; emp_id: string; user_name: string; permissions: RoleId[] }>>('/api/users?page=1&pageSize=100');
    return users.map((user): UserRoleAssignment => ({ id: user.user_id, employeeId: user.emp_id, employeeName: user.user_name, roles: dedupeRoles(user.permissions ?? []), status: 'active' }));
  },
  async assignRole(input: Omit<UserRoleAssignment, 'id'>) {
    const users = await apiRequest<Array<{ user_id: string }>>(`/api/users${queryString({ search: input.employeeId, page: 1, pageSize: 1 })}`);
    const user = users[0];
    if (!user) throw new Error('User not found');
    await apiRequest(`/api/users/${encodeURIComponent(user.user_id)}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions: input.roles }) });
    return { ...input, id: user.user_id };
  },
  async updateAssignment(id: string, input: Omit<UserRoleAssignment, 'id'>) { await apiRequest(`/api/users/${encodeURIComponent(id)}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions: input.roles }) }); return { ...input, id }; },
};
