import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isBcRoute = location.pathname.startsWith('/bc');
  const roleLower = (user?.role || '').toLowerCase();
  const isStaffRole =
    user?.role === 'BloodCenterStaff' ||
    user?.role === 'Administrator' ||
    user?.role === 'HospitalStaff' ||
    roleLower.includes('staff') ||
    roleLower.includes('admin') ||
    roleLower.includes('hospital') ||
    roleLower.includes('bloodcenter');

  // Strict Access Control: Only BloodCenterStaff / Staff can access Blood Center (/bc/*) routes
  if (isBcRoute && !isStaffRole) {
    toast.error('Cảnh báo truy cập: Chỉ tài khoản Cán bộ (BloodCenterStaff) mới có quyền truy cập Cổng Trung tâm máu.');
    return <Navigate to="/my-appointments" replace />;
  }

  // If a staff user accesses root citizen pages, redirect to BC campaigns dashboard
  if (!isBcRoute && isStaffRole && (location.pathname === '/' || location.pathname === '/dashboard')) {
    return <Navigate to="/bc/campaigns" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
