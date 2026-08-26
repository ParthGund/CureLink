import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_DASHBOARDS = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
};

/**
 * Route wrapper that enforces authentication and optional role authorization.
 *
 * @param {{ allowedRoles?: string[] }} props
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const destination = ROLE_DASHBOARDS[user.role] || '/login';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
