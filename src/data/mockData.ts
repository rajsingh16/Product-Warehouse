import type { Employee, MockUser, Project, ProjectFile, RoleDefinition, RoleId, Task, UserRoleAssignment, RoleName } from '../types';

export const DEMO_OTP = '123456';

export const mockUsers: MockUser[] = [
  {
    id: 'user-1',
    userId: 'admin',
    password: 'admin123',
    name: 'Raj Singh',
    role: 'Administrator',
    email: 'raj.singh@projectwarehouse.com',
    employeeId: 'EMP001',
    whatsappLastDigits: '45',
  },
  {
    id: 'user-2',
    userId: 'john',
    password: 'john123',
    name: 'John Doe',
    role: 'Project Manager',
    email: 'john.doe@projectwarehouse.com',
    employeeId: 'EMP002',
    whatsappLastDigits: '78',
  },
  {
    id: 'user-3',
    userId: 'sarah',
    password: 'sarah123',
    name: 'Sarah Smith',
    role: 'Manager',
    email: 'sarah.smith@projectwarehouse.com',
    employeeId: 'EMP003',
    whatsappLastDigits: '92',
  },
];

export const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Raj Singh',
    employeeId: 'EMP001',
    mobileNumber: '9876543210',
    email: 'raj.singh@projectwarehouse.com',
    role: 'Administrator',
    dateOfJoining: '2025-01-10',
    status: 'active',
    projectIds: ['proj-1', 'proj-2', 'proj-3', 'proj-4'],
  },
  {
    id: 'emp-2',
    name: 'John Doe',
    employeeId: 'EMP002',
    mobileNumber: '9876501234',
    email: 'john.doe@projectwarehouse.com',
    role: 'Project Manager',
    dateOfJoining: '2025-02-15',
    status: 'active',
    projectIds: ['proj-1', 'proj-2'],
  },
  {
    id: 'emp-3',
    name: 'Sarah Smith',
    employeeId: 'EMP003',
    mobileNumber: '9876512345',
    email: 'sarah.smith@projectwarehouse.com',
    role: 'Manager',
    dateOfJoining: '2025-03-12',
    status: 'active',
    projectIds: ['proj-1', 'proj-3'],
  },
  {
    id: 'emp-4',
    name: 'Mike Johnson',
    employeeId: 'EMP004',
    mobileNumber: '9876523456',
    email: 'mike.johnson@projectwarehouse.com',
    role: 'Employee',
    dateOfJoining: '2025-04-08',
    status: 'active',
    projectIds: ['proj-2', 'proj-4'],
  },
  {
    id: 'emp-5',
    name: 'Priya Sharma',
    employeeId: 'EMP005',
    mobileNumber: '9876534567',
    email: 'priya.sharma@projectwarehouse.com',
    role: 'Viewer',
    dateOfJoining: '2025-05-20',
    status: 'active',
    projectIds: ['proj-3', 'proj-4'],
  },
];

export const roles: RoleName[] = ['Administrator', 'Manager', 'Project Manager', 'Employee', 'Viewer'];

export const roleDefinitions: RoleDefinition[] = [
  { id: 'project_view', label: 'Project View', group: 'Project' },
  { id: 'project_create', label: 'Project Create', group: 'Project' },
  { id: 'employee_view', label: 'Employee View', group: 'Employee' },
  { id: 'employee_create', label: 'Employee Create', group: 'Employee' },
  { id: 'user_view', label: 'User View', group: 'User' },
  { id: 'user_create', label: 'User Create', group: 'User' },
  { id: 'user_assign', label: 'User Assign', group: 'User' },
  { id: 'task_view', label: 'Task View', group: 'Task' },
  { id: 'task_create', label: 'Task Create', group: 'Task' },
  { id: 'task_edit', label: 'Task Edit', group: 'Task' },
  { id: 'task_delete', label: 'Task Delete', group: 'Task' },
];

const employeeRoleAssignments: Record<string, RoleId[]> = {
  EMP001: ['project_view', 'project_create', 'employee_view', 'task_view', 'task_edit', 'user_view', 'user_assign'],
  EMP002: ['project_view', 'task_view'],
  EMP003: ['task_view', 'task_create'],
  EMP004: ['project_view', 'employee_view', 'task_view', 'task_edit'],
  EMP005: [],
};

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    taskId: 'TASK001',
    description: 'Prepare report',
    assignedTo: { employeeId: 'EMP001', employeeName: 'Raj Singh' },
    assignedOn: '2026-08-22',
    referenceLink: { kind: 'url', label: 'Project brief', url: 'https://example.com/project-brief' },
    comments: 'Project documentation and final report preparation for the current release cycle.',
    status: 'Pending',
  },
  {
    id: 'task-2',
    taskId: 'TASK002',
    description: 'Review analysis data',
    assignedTo: { employeeId: 'EMP003', employeeName: 'Sarah Smith' },
    assignedOn: '2026-08-21',
    comments: 'Validate all uploaded analysis files and flag missing metadata before project closure.',
    status: 'In Progress',
  },
];

export const mockRoleAssignments: UserRoleAssignment[] = mockEmployees.map((employee) => ({
  id: `role-${employee.id}`,
  employeeId: employee.employeeId,
  employeeName: employee.name,
  roles: employeeRoleAssignments[employee.employeeId] ?? [],
  status: employee.status,
}));

function createSampleFiles(prefix: string, folderName: string): ProjectFile[] {
  const baseDate = '2026-08-22';
  return [
    {
      id: `${prefix}-${folderName}-f1`,
      name: `${folderName.toLowerCase()}-report.pdf`,
      type: 'pdf',
      size: 2.4 * 1024 * 1024,
      uploadedBy: 'Raj Singh',
      uploadedAt: baseDate,
    },
    {
      id: `${prefix}-${folderName}-f2`,
      name: `${folderName.toLowerCase()}-data.xlsx`,
      type: 'xlsx',
      size: 1.2 * 1024 * 1024,
      uploadedBy: 'Sarah Smith',
      uploadedAt: '2026-08-21',
    },
    {
      id: `${prefix}-${folderName}-f3`,
      name: `${folderName.toLowerCase()}-notes.txt`,
      type: 'txt',
      size: 12 * 1024,
      uploadedBy: 'John Doe',
      uploadedAt: '2026-08-20',
      content: `Sample notes for folder ${folderName}.\nThis is mock content for preview purposes.`,
    },
    {
      id: `${prefix}-${folderName}-f4`,
      name: `${folderName.toLowerCase()}-config.json`,
      type: 'json',
      size: 4 * 1024,
      uploadedBy: 'Mike Johnson',
      uploadedAt: '2026-08-19',
      content: JSON.stringify({ folder: folderName, status: 'active', version: 1 }, null, 2),
    },
  ];
}

function createFolders(projectId: string): Project['folders'] {
  return ['Informative Data', 'Analysis Data', 'Reference Data', 'Reports'].map((name) => ({
    id: `${projectId}-folder-${name.toLowerCase()}`,
    name,
    files: createSampleFiles(projectId, name),
  }));
}

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Project Alpha',
    assignedEmployeeIds: ['emp-1', 'emp-2', 'emp-3'],
    createdAt: '2026-08-20',
    folders: createFolders('proj-1'),
  },
  {
    id: 'proj-2',
    name: 'Project Beta',
    assignedEmployeeIds: ['emp-2', 'emp-4'],
    createdAt: '2026-08-18',
    folders: createFolders('proj-2'),
  },
  {
    id: 'proj-3',
    name: 'Project Warehouse',
    assignedEmployeeIds: ['emp-1', 'emp-3', 'emp-5'],
    createdAt: '2026-08-15',
    folders: createFolders('proj-3'),
  },
  {
    id: 'proj-4',
    name: 'Project Gamma',
    assignedEmployeeIds: ['emp-4', 'emp-5'],
    createdAt: '2026-08-10',
    folders: createFolders('proj-4'),
  },
];

export function getEmployeeNameById(id: string): string {
  return mockEmployees.find((e) => e.id === id)?.name ?? 'Unknown';
}

export function getEmployeeNames(ids: string[]): string {
  return ids.map(getEmployeeNameById).join(', ');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
