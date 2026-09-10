import { ChevronDown, FolderKanban, LayoutDashboard, ShieldCheck, UserRoundCheck, Users, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import logoIcon from '../../assets/logo-icon.svg';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [employeesOpen, setEmployeesOpen] = useState(location.pathname.startsWith('/employees'));
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-5">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="" className="h-11 w-11" />
            <div>
              <p className="text-sm font-semibold text-slate-900">ShanConnects</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <NavLink to="/dashboard" onClick={onClose} className={navClass}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink to="/projects" onClick={onClose} className={navClass}>
            <FolderKanban className="h-4 w-4" />
            Projects
          </NavLink>
          <button
            type="button"
            onClick={() => setEmployeesOpen((open) => !open)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname.startsWith('/employees')
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              Employees
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${employeesOpen ? 'rotate-180' : ''}`} />
          </button>
          {employeesOpen && (
            <div className="ml-7 space-y-1 border-l border-slate-200 pl-3">
              <NavLink to="/employees" onClick={onClose} end className={navClass}>
                <UserRoundCheck className="h-4 w-4" />
                Employee List
              </NavLink>
              <NavLink to="/employees/tasks" onClick={onClose} className={navClass}>
                <FolderKanban className="h-4 w-4" />
                Task
              </NavLink>
            </div>
          )}
          <NavLink to="/user-role" onClick={onClose} className={navClass}>
            <ShieldCheck className="h-4 w-4" />
            User Role
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
