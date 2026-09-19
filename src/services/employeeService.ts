import { apiRequest, queryString } from './apiClient';
import type { Employee, RoleName } from '../types';

type ApiUser = { user_id: string; emp_id: string; user_name: string; mobile: string | null; email: string; date_of_joining: string | null; user_type: 'Administrator' | 'User'; permissions?: string[] };
type CreateEmployeeInput = {
  employeeId: string;
  name: string;
  mobileNumber: string;
  email: string;
  dateOfJoining: string;
  status: Employee['status'];
  password: string;
};

type UpdateEmployeeInput = Partial<Employee> & {
  password?: string;
};
function mapUser(user: ApiUser): Employee { return { id: user.user_id, employeeId: user.emp_id, name: user.user_name, mobileNumber: user.mobile ?? '', email: user.email, dateOfJoining: user.date_of_joining ?? '', role: (user.user_type === 'Administrator' ? 'Administrator' : 'Employee') as RoleName, status: 'active', projectIds: [] }; }

export const employeeService = {
  async getEmployees() { return (await apiRequest<ApiUser[]>('/api/users?page=1&pageSize=100')).map(mapUser); },
  async getEmployee(id: string) { try { return mapUser(await apiRequest<ApiUser>(`/api/users/${encodeURIComponent(id)}`)); } catch (error) { if (error instanceof Error && error.message === 'User not found') return null; throw error; } },
  async searchEmployees(query: string) { return (await apiRequest<ApiUser[]>(`/api/users${queryString({ search: query, page: 1, pageSize: 25 })}`)).map(mapUser); },
  async createEmployee(input: CreateEmployeeInput) {
    const user = await apiRequest<ApiUser>(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify({
          userId: `user-${Date.now()}`,
          empId: input.employeeId,
          userName: input.name,
          mobile: input.mobileNumber,
          email: input.email,
          dateOfJoining: input.dateOfJoining,
          userType: 'User',
          password: input.password,
        }),
      }
    );
  
    return mapUser(user);
  },
  
  async updateEmployee(
    id: string,
    input: UpdateEmployeeInput
  ) {
    const current = await apiRequest<ApiUser>(
      `/api/users/${encodeURIComponent(id)}`
    );
  
    const body: Record<string, unknown> = {
      userId: id,
      empId: input.employeeId ?? current.emp_id,
      userName: input.name ?? current.user_name,
      mobile: input.mobileNumber ?? current.mobile,
      email: input.email ?? current.email,
      dateOfJoining:
        input.dateOfJoining ?? current.date_of_joining,
      userType: current.user_type,
    };
  
    if (input.password) {
      body.password = input.password;
    }
  
    const user = await apiRequest<ApiUser>(
      `/api/users/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
  
    return mapUser(user);
  },
  async deleteEmployee(id: string) { await apiRequest(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
};
