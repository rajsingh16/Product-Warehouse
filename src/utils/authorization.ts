import { roleDefinitions } from '../data/mockData';
import type { AuthUser, RoleId, RoleName, UserRoleAssignment } from '../types';

export type Permission =
  | 'projects:create'
  | 'projects:edit'
  | 'projects:delete'
  | 'employees:create'
  | 'employees:edit'
  | 'employees:delete'
  | 'tasks:create'
  | 'tasks:edit'
  | 'tasks:delete'
  | 'roles:assign';

const rolePermissions: Record<RoleName, Permission[]> = {
  Administrator: [
    'projects:create',
    'projects:edit',
    'projects:delete',
    'employees:create',
    'employees:edit',
    'employees:delete',
    'tasks:create',
    'tasks:edit',
    'tasks:delete',
    'roles:assign',
  ],
  Manager: ['projects:create', 'projects:edit', 'employees:create', 'employees:edit', 'tasks:create', 'tasks:edit', 'tasks:delete'],
  'Project Manager': ['projects:edit', 'tasks:create', 'tasks:edit', 'tasks:delete'],
  Employee: ['tasks:edit'],
  Viewer: [],
};

const permissionRoles: Record<Permission, RoleId> = {
  'projects:create': 'project_create',
  'projects:edit': 'project_create',
  'projects:delete': 'project_create',
  'employees:create': 'employee_create',
  'employees:edit': 'employee_create',
  'employees:delete': 'employee_create',
  'tasks:create': 'task_create',
  'tasks:edit': 'task_edit',
  'tasks:delete': 'task_delete',
  'roles:assign': 'user_assign',
};

const roleIds = roleDefinitions.map((role) => role.id);

export function hasRole(user: AuthUser | null, role: RoleId): boolean {
  if (!user) return false;
  const stored = localStorage.getItem('pw_role_assignments');
  if (!stored) return rolePermissions[user.role]?.includes(Object.entries(permissionRoles).find(([, id]) => id === role)?.[0] as Permission) ?? false;

  try {
    const assignments = JSON.parse(stored) as Array<UserRoleAssignment | { employeeId: string; role?: string; roles?: RoleId[] }>;
    const assignment = assignments.find((item) => item.employeeId === user.employeeId);
    if (!assignment) return false;
    const assignedRoles = Array.isArray(assignment.roles) ? [...new Set(assignment.roles)].filter((id) => roleIds.includes(id)) : [];
    return assignedRoles.includes(role);
  } catch {
    return false;
  }
}

export function can(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false;
  const requiredRole = permissionRoles[permission];
  return hasRole(user, requiredRole) || (rolePermissions[user.role]?.includes(permission) ?? false);
}
