import { apiRequest, queryString } from './apiClient';
import type { Employee, RoleName } from '../types';

type ApiUser = {
   user_id: string; 
   emp_id: string; 
   user_name: string;
   designation: string | null; 
   mobile: string | null; 
   email: string; 
   date_of_joining: string | null; 
   user_type: 'Administrator' | 'User'; 
   permissions?: string[] };
type CreateEmployeeInput = {
  name: string;
  designation: string;
  mobileNumber: string;
  email: string;
  dateOfJoining: string;
  status: Employee['status'];
  password: string;
};

type UpdateEmployeeInput = Partial<Employee>;
function mapUser(user: ApiUser): Employee { return { id: user.user_id, employeeId: user.emp_id, name: user.user_name,designation: user.designation ?? '', mobileNumber: user.mobile ?? '', email: user.email, dateOfJoining: user.date_of_joining ?? '', role: (user.user_type === 'Administrator' ? 'Administrator' : 'Employee') as RoleName, status: 'active', projectIds: [] }; }

export const employeeService = {
  async getEmployees() { return (await apiRequest<ApiUser[]>('/api/users?page=1&pageSize=100')).map(mapUser); },
  async getEmployee(id: string) {
  try {
    const user = await apiRequest<ApiUser>(`/api/users/${encodeURIComponent(id)}`);
    return mapUser(user);
  } catch (error: any) {
    // Check for HTTP 404 or typical API error formats
    if (
      error?.status === 404 || 
      error?.message?.toLowerCase().includes('not found')
    ) {
      return null;
    }
    throw error;
  }
},
  async searchEmployees(query: string) { return (await apiRequest<ApiUser[]>(`/api/users${queryString({ search: query, page: 1, pageSize: 25 })}`)).map(mapUser); },
  async createEmployee(input: CreateEmployeeInput) {
    const user = await apiRequest<ApiUser>(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify({
          userId: `user-${Date.now()}`,
          //empId: input.employeeId ?? `EMP-${Date.now()}`,
          userName: input.name,
          designation: input.designation,
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
  
  async updateEmployee(id: string, input: UpdateEmployeeInput) {
    const current = await apiRequest<ApiUser>(
      `/api/users/${encodeURIComponent(id)}`
    );
  
    const body = {
      userId: id,
      empId: input.employeeId ?? current.emp_id,
      userName: input.name ?? current.user_name,
      designation: input.designation ?? current.designation,
      mobile: input.mobileNumber ?? current.mobile,
      email: input.email ?? current.email,
      dateOfJoining: input.dateOfJoining ?? current.date_of_joining,
      userType: current.user_type,
      //...(input.password && { password: input.password }),
    };
  
    const user = await apiRequest<ApiUser>(
      `/api/users/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  
    return mapUser(user);
  },
  async deleteEmployee(id: string) { await apiRequest(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
};
