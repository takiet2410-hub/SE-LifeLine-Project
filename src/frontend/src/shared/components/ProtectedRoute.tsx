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
  const isHospitalRoute = location.pathname.startsWith('/hospital');
  const isSosAlertsRoute = location.pathname.startsWith('/sos-alerts');
  const isDonorRoute =
    location.pathname.startsWith('/my-appointments') ||
    location.pathname.startsWith('/map') ||
    location.pathname.startsWith('/profile') ||
    isSosAlertsRoute;

  const userRole = user?.role || 'Donor';
  const roleLower = userRole.toLowerCase();

  const isBcStaffRole =
    userRole === 'BloodCenterStaff' ||
    userRole === 'Administrator' ||
    roleLower.includes('bloodcenter');

  const isHospitalStaffRole =
    userRole === 'HospitalStaff' ||
    userRole === 'Hospital' ||
    roleLower.includes('hospital');

  const isAdminRole =
    userRole === 'Administrator' ||
    roleLower.includes('admin');

  const isStaffRole = isBcStaffRole || isHospitalStaffRole || isAdminRole;

  const isDonorRole = userRole === 'Donor' || roleLower === 'donor';

  // 1. Strict Access Control: Only Staff/Admin roles can access Blood Center (/bc/*) routes
  if (isBcRoute && !isStaffRole) {
    toast.error('Cảnh báo truy cập: Chỉ tài khoản Cán bộ Y tế / Trung tâm Máu mới có quyền truy cập Cổng quản lý.');
    return <Navigate to="/my-appointments" replace />;
  }

  // 2. Hospital Routes: Only Hospital Staff can access Hospital routes
  if (isHospitalRoute && !isHospitalStaffRole && !isAdminRole) {
    toast.error('Cảnh báo truy cập: Chỉ tài khoản Bệnh viện mới có quyền truy cập Cổng quản lý SOS.');
    return isDonorRole ? <Navigate to="/my-appointments" replace /> : <Navigate to="/bc/campaigns" replace />;
  }

  // 3. Strict Access Control: Only Donors can access appointment booking & donor portal routes
  if (isDonorRoute && !isDonorRole) {
    toast.info('Tài khoản Cán bộ Y tế đã được tự động chuyển hướng đến Cổng quản lý đợt hiến máu.');
    return <Navigate to="/bc/campaigns" replace />;
  }

  // 4. Fallback root/dashboard redirect based on role
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    if (isHospitalStaffRole) {
      return <Navigate to="/hospital/sos-requests" replace />;
    }
    if (isBcStaffRole || isAdminRole) {
      return <Navigate to="/bc/campaigns" replace />;
    }
    return <Navigate to="/my-appointments" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
