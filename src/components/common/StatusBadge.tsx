import type { EmployeeStatus, TaskStatus } from '../../types';

type Status = EmployeeStatus | TaskStatus;

const classes: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-600',
  Pending: 'bg-amber-100 text-amber-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  'On Hold': 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-red-100 text-red-700',
  '25% progress complete': 'bg-cyan-100 text-cyan-700',
  '50% progress complete': 'bg-indigo-100 text-indigo-700',
  '75% progress complete': 'bg-teal-100 text-teal-700',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes[status] ?? classes.inactive}`}>
      {status}
    </span>
  );
}