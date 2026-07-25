import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Optional: Check if user is trying to access admin routes without proper role
  // This can be enhanced based on specific route patterns
  const isAdminRoute = window.location.pathname.startsWith('/bc/');
  if (isAdminRoute && user?.role !== 'admin') {
    // Redirect non-admin users away from admin routes
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};
