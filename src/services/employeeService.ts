import { mockEmployees } from '../data/mockData';
import type { Employee } from '../types';

const EMPLOYEES_KEY = 'pw_employees';

function loadEmployees(): Employee[] {
  const stored = localStorage.getItem(EMPLOYEES_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(mockEmployees));
  return structuredClone(mockEmployees);
}

function saveEmployees(employees: Employee[]): void {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

function generateId(): string {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const employeeService = {
  async getEmployees(): Promise<Employee[]> {
    await delay(200);
    return loadEmployees();
  },

  async getEmployee(id: string): Promise<Employee | null> {
    await delay(150);
    return loadEmployees().find((e) => e.id === id) ?? null;
  },

  async searchEmployees(query: string): Promise<Employee[]> {
    await delay(100);
    const employees = loadEmployees();
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.mobileNumber.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q),
    );
  },

  async createEmployee(input: Omit<Employee, 'id' | 'projectIds' | 'role'> & { role?: Employee['role'] }): Promise<Employee> {
    await delay(200);
    const employees = loadEmployees();
    if (!input.employeeId.trim() || !input.name.trim() || !input.mobileNumber.trim() || !input.email.trim() || !input.dateOfJoining) {
      throw new Error('All employee fields are required.');
    }
    if (employees.some((employee) => employee.employeeId.toLowerCase() === input.employeeId.trim().toLowerCase())) {
      throw new Error('Employee ID already exists.');
    }
    const employee: Employee = {
      id: generateId(),
      employeeId: input.employeeId.trim(),
      name: input.name.trim(),
      mobileNumber: input.mobileNumber.trim(),
      email: input.email.trim(),
      dateOfJoining: input.dateOfJoining,
      status: input.status,
      role: input.role ?? 'Employee',
      projectIds: [],
    };
    employees.unshift(employee);
    saveEmployees(employees);
    return employee;
  },

  async updateEmployee(id: string, input: Partial<Employee>): Promise<Employee> {
    await delay(200);
    const employees = loadEmployees();
    const index = employees.findIndex((employee) => employee.id === id);
    if (index === -1) throw new Error('Employee not found.');
    const updated = { ...employees[index], ...input };
    employees[index] = updated;
    saveEmployees(employees);
    return updated;
  },

  async deleteEmployee(id: string): Promise<void> {
    await delay(200);
    const employees = loadEmployees();
    saveEmployees(employees.filter((employee) => employee.id !== id));
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Future: GET/POST/PUT/DELETE /api/employees
