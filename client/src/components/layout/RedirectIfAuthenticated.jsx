import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_DASHBOARDS = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
};

/**
 * Route wrapper for public auth pages (login, signup).
 * Redirects already-authenticated users to their role dashboard.
 */
export default function RedirectIfAuthenticated() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = ROLE_DASHBOARDS[user.role] || '/';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
