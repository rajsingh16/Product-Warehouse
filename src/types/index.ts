export interface AuthUser {
  id: string;
  userId: string;
  name: string;
  role: RoleName;
  email: string;
  employeeId: string;
  whatsappLastDigits: string;
  userType?: 'Administrator' | 'User';
  permissions?: RoleId[];
}

export interface MockUser extends AuthUser {
  password: string;
}

export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  mobileNumber: string;
  email: string;
  role: RoleName;
  dateOfJoining: string;
  status: 'active' | 'inactive';
  projectIds: string[];
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  content?: string;
  blobUrl?: string;
}

export interface Folder {
  id: string;
  name: string;
  files: ProjectFile[];
  folders?: Folder[];
}

export interface Project {
  id: string;
  name: string;
  assignedEmployeeIds: string[];
  assignedEmployeeNames?: string[];
  createdAt: string;
  status?: string;
  folders: Folder[];
}

export type EmployeeStatus = 'active' | 'inactive';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled' | '25% progress complete' | '50% progress complete' | '75% progress complete';
export type RoleName = 'Administrator' | 'Manager' | 'Project Manager' | 'Employee' | 'Viewer';
export type RoleId =
  | 'project_view'
  | 'project_create'
  | 'employee_view'
  | 'employee_create'
  | 'user_view'
  | 'user_create'
  | 'user_assign'
  | 'task_view'
  | 'task_create'
  | 'task_edit'
  | 'task_delete';

export interface RoleDefinition {
  id: RoleId;
  label: string;
  group: 'Project' | 'Employee' | 'User' | 'Task';
}

export interface TaskReference {
  kind: 'url' | 'file';
  label: string;
  url?: string;
  file?: ProjectFile;
}

export interface Task {
  id: string;
  taskId: string;
  projectId?: string;
  projectName?: string;
  description: string;
  assignedTo: {
    employeeId: string;
    employeeName: string;
  };
  assignedOn: string;
  referenceLink?: TaskReference;
  referenceDocument?: ProjectFile;
  comments: string;
  status: TaskStatus;
}

export interface UserRoleAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  roles: RoleId[];
  status: EmployeeStatus;
}

export interface PendingAuth {
  challengeId: string;
  maskedPhone: string;
  expiresAt: number;
  resendAvailableAt: number;
}

export interface CreateProjectInput {
  name: string;
  assignedEmployeeIds: string[];
}

export interface UpdateProjectInput {
  name?: string;
  assignedEmployeeIds?: string[];
}

export const SUPPORTED_EXTENSIONS = [
  '.txt',
  '.doc',
  '.docx',
  '.pdf',
  '.xls',
  '.xlsx',
  '.csv',
  '.json',
  '.jpg',
  '.jpeg',
] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];
