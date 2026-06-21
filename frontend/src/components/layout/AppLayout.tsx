import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu } from './Menu';

export function AppLayout() {
  const auth = useAuth();
  const location = useLocation();

  const protectedPaths = ['/history', '/admin'];
  if (protectedPaths.some((p) => location.pathname.startsWith(p))) {
    if (!auth.isAuthenticated) return <Navigate to="/profile" replace />;
    if (location.pathname.startsWith('/history') && !auth.isApproved && !auth.isAdmin) {
      return <Navigate to="/profile" replace />;
    }
  }

  if (location.pathname === '/admin' && !auth.isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="app-shell">
      <Menu />
      <Outlet />
    </div>
  );
}
