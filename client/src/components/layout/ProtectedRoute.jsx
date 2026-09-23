import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

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
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isAuthenticated, location.pathname]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const destination = ROLE_DASHBOARDS[user.role] || '/';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
