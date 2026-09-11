import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, type Permission } from '../../utils/authorization';

export function PermissionRoute({ permission }: { permission: Permission }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!hasPermission(user, permission)) return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
