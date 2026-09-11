import type { AuthUser, RoleId, RoleName } from '../types';

export type Permission = RoleId | 'projects:create' | 'projects:edit' | 'projects:delete' | 'employees:create' | 'employees:edit' | 'employees:delete' | 'tasks:create' | 'tasks:edit' | 'tasks:delete' | 'roles:assign';

const aliases: Partial<Record<Permission, RoleId>> = {
  'projects:create': 'project_create', 'projects:edit': 'project_create', 'projects:delete': 'project_create',
  'employees:create': 'employee_create', 'employees:edit': 'employee_create', 'employees:delete': 'employee_create',
  'tasks:create': 'task_create', 'tasks:edit': 'task_edit', 'tasks:delete': 'task_delete', 'roles:assign': 'user_assign',
};

const legacyRolePermissions: Record<RoleName, RoleId[]> = {
  Administrator: ['project_view', 'project_create', 'employee_view', 'employee_create', 'user_view', 'user_create', 'user_assign', 'task_view', 'task_create', 'task_edit', 'task_delete'],
  Manager: ['project_view', 'project_create', 'employee_view', 'employee_create', 'task_view', 'task_create', 'task_edit', 'task_delete'],
  'Project Manager': ['project_view', 'task_view', 'task_create', 'task_edit', 'task_delete'],
  Employee: ['task_view', 'task_edit'],
  Viewer: ['project_view', 'employee_view', 'task_view'],
};

function canonical(permission: Permission): RoleId {
  return aliases[permission] ?? permission as RoleId;
}

export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.userType === 'Administrator' || user.role === 'Administrator') return true;
  const required = canonical(permission);
  if (Array.isArray(user.permissions)) return user.permissions.includes(required);
  return legacyRolePermissions[user.role]?.includes(required) ?? false;
}

export function hasRole(user: AuthUser | null, role: RoleId): boolean {
  return hasPermission(user, role);
}

export function can(user: AuthUser | null, permission: Permission): boolean {
  return hasPermission(user, permission);
}
