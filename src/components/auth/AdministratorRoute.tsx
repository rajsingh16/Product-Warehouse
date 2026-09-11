import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AdministratorRoute() {
  const { user } = useAuth();
  if (user?.userType !== 'Administrator' && user?.role !== 'Administrator') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
