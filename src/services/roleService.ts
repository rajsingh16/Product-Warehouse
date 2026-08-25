import { mockRoleAssignments, roleDefinitions } from '../data/mockData';
import type { RoleId, UserRoleAssignment } from '../types';

const ROLES_KEY = 'pw_role_assignments';

export const availableRoles = roleDefinitions;
export const availableRoleIds = roleDefinitions.map((role) => role.id);

const legacyRoleMap: Record<string, RoleId[]> = {
  Administrator: availableRoleIds,
  Manager: ['project_view', 'project_create', 'employee_view', 'employee_create', 'task_view', 'task_create', 'task_edit', 'task_delete'],
  'Project Manager': ['project_view', 'task_view', 'task_create', 'task_edit', 'task_delete'],
  Employee: ['task_view', 'task_edit'],
  Viewer: ['project_view', 'employee_view', 'task_view'],
};

export function dedupeRoles(roles: RoleId[]): RoleId[] {
  return [...new Set(roles)].filter((role): role is RoleId => availableRoleIds.includes(role));
}

function normalizeAssignment(assignment: UserRoleAssignment | (Omit<UserRoleAssignment, 'roles'> & { role?: string })): UserRoleAssignment {
  const roles = 'roles' in assignment && Array.isArray(assignment.roles)
    ? assignment.roles
    : legacyRoleMap[assignment.role ?? ''] ?? [];

  return {
    id: assignment.id,
    employeeId: assignment.employeeId,
    employeeName: assignment.employeeName,
    roles: dedupeRoles(roles),
    status: assignment.status,
  };
}

function loadAssignments(): UserRoleAssignment[] {
  const stored = localStorage.getItem(ROLES_KEY);
  if (stored) {
    const assignments = (JSON.parse(stored) as Array<UserRoleAssignment | (Omit<UserRoleAssignment, 'roles'> & { role?: string })>).map(normalizeAssignment);
    saveAssignments(assignments);
    return assignments;
  }
  localStorage.setItem(ROLES_KEY, JSON.stringify(mockRoleAssignments));
  return structuredClone(mockRoleAssignments);
}

function saveAssignments(assignments: UserRoleAssignment[]): void {
  localStorage.setItem(ROLES_KEY, JSON.stringify(assignments));
}

function generateId(): string {
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const roleService = {
  async getAssignments(): Promise<UserRoleAssignment[]> {
    await delay(150);
    return loadAssignments();
  },

  async assignRole(input: Omit<UserRoleAssignment, 'id'>): Promise<UserRoleAssignment> {
    await delay(200);
    const assignments = loadAssignments();
    const existingIndex = assignments.findIndex((assignment) => assignment.employeeId === input.employeeId);
    const assignment: UserRoleAssignment = {
      ...input,
      roles: dedupeRoles(input.roles),
      id: existingIndex >= 0 ? assignments[existingIndex].id : generateId(),
    };
    if (existingIndex >= 0) {
      assignments[existingIndex] = assignment;
    } else {
      assignments.unshift(assignment);
    }
    saveAssignments(assignments);
    return assignment;
  },

  async updateAssignment(id: string, input: Omit<UserRoleAssignment, 'id'>): Promise<UserRoleAssignment> {
    await delay(200);
    const assignments = loadAssignments();
    const index = assignments.findIndex((assignment) => assignment.id === id);
    if (index === -1) throw new Error('Role assignment not found.');
    const updated = { ...input, roles: dedupeRoles(input.roles), id };
    assignments[index] = updated;
    saveAssignments(assignments);
    return updated;
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Future: GET/POST/PUT /api/user-roles
