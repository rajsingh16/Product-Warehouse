import { apiRequest, queryString } from './apiClient';
import type { Employee, RoleName } from '../types';

type ApiUser = { user_id: string; emp_id: string; user_name: string; mobile: string | null; email: string; user_type: 'Administrator' | 'User'; permissions?: string[] };
function mapUser(user: ApiUser): Employee { return { id: user.user_id, employeeId: user.emp_id, name: user.user_name, mobileNumber: user.mobile ?? '', email: user.email, role: (user.user_type === 'Administrator' ? 'Administrator' : 'Employee') as RoleName, dateOfJoining: '', status: 'active', projectIds: [] }; }

export const employeeService = {
  async getEmployees() { return (await apiRequest<ApiUser[]>('/api/users?page=1&pageSize=100')).map(mapUser); },
  async getEmployee(id: string) { try { return mapUser(await apiRequest<ApiUser>(`/api/users/${encodeURIComponent(id)}`)); } catch (error) { if (error instanceof Error && error.message === 'User not found') return null; throw error; } },
  async searchEmployees(query: string) { return (await apiRequest<ApiUser[]>(`/api/users${queryString({ search: query, page: 1, pageSize: 25 })}`)).map(mapUser); },
  async createEmployee(input: Omit<Employee, 'id' | 'projectIds' | 'role'> & { role?: Employee['role'] }) {
    const user = await apiRequest<ApiUser>('/api/users', { method: 'POST', body: JSON.stringify({ userId: `user-${Date.now()}`, empId: input.employeeId, userName: input.name, mobile: input.mobileNumber, email: input.email, userType: 'User' }) });
    return mapUser(user);
  },
  async updateEmployee(id: string, input: Partial<Employee>) {
    const current = await apiRequest<ApiUser>(`/api/users/${encodeURIComponent(id)}`);
    const user = await apiRequest<ApiUser>(`/api/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ userId: id, empId: input.employeeId ?? current.emp_id, userName: input.name ?? current.user_name, mobile: input.mobileNumber ?? current.mobile, email: input.email ?? current.email, userType: current.user_type }) });
    return mapUser(user);
  },
  async deleteEmployee(id: string) { await apiRequest(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
};
