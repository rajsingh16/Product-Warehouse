import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PermissionRoute } from './components/auth/PermissionRoute';
import { AdministratorRoute } from './components/auth/AdministratorRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SessionProvider } from './context/SessionContext';
import { Dashboard } from './pages/Dashboard';
import { EmployeeDetails } from './pages/EmployeeDetails';
import { Employees } from './pages/Employees';
import { FolderDetails } from './pages/FolderDetails';
import { Login } from './pages/Login';
//import { OTP } from './pages/OTP';
import { ProjectDetails } from './pages/ProjectDetails';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { TaskMaster } from './pages/TaskMaster';
import { UserRole } from './pages/UserRole';
import Profile from './pages/Profile';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <SessionProvider>
            <ProtectedRoute />
          </SessionProvider>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route element={<AdministratorRoute />}>
          <Route path="/master/task-master" element={<TaskMaster />} />
        </Route>
        <Route element={<PermissionRoute permission="project_view" />}>
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/projects/:projectId/:folderId" element={<FolderDetails />} />
        </Route>
        <Route element={<PermissionRoute permission="employee_view" />}>
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/list" element={<Employees />} />
          <Route path="/employees/:employeeId" element={<EmployeeDetails />} />
        </Route>
        <Route element={<PermissionRoute permission="task_view" />}>
          <Route path="/employees/tasks" element={<Tasks />} />
        </Route>
        <Route element={<PermissionRoute permission="user_view" />}>
          <Route path="/user-role" element={<UserRole />} />
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
