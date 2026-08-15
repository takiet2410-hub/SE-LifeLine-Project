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
    location.pathname.startsWith('/dashboard') ||
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

  const isAdminRoute = location.pathname.startsWith('/admin');

  // 1. System Admin Routes (/admin/*): Only Administrator allowed
  if (isAdminRoute && !isAdminRole) {
    toast.error('Cảnh báo truy cập: Chỉ tài khoản Administrator mới có quyền truy cập Cổng Quản trị.');
    return isHospitalStaffRole
      ? <Navigate to="/hospital/sos-requests" replace />
      : isBcStaffRole
      ? <Navigate to="/bc/campaigns" replace />
      : <Navigate to="/my-appointments" replace />;
  }

  // 2. Strict Access Control: Only Staff/Admin roles can access Blood Center (/bc/*) routes
  if (isBcRoute && !isStaffRole) {
    toast.error('Cảnh báo truy cập: Chỉ tài khoản Cán bộ Y tế / Trung tâm Máu mới có quyền truy cập Cổng quản lý.');
    return <Navigate to="/my-appointments" replace />;
  }

  // 3. Hospital Routes: Only Hospital Staff / Admin can access Hospital routes
  if (isHospitalRoute && !isHospitalStaffRole && !isAdminRole) {
    toast.error('Cảnh báo truy cập: Chỉ tài khoản Bệnh viện mới có quyền truy cập Cổng quản lý SOS.');
    return isDonorRole ? <Navigate to="/my-appointments" replace /> : <Navigate to="/bc/campaigns" replace />;
  }

  // 4. Strict Access Control: Donors routes access attempt by Staff/Admin
  if (isDonorRoute && !isDonorRole) {
    if (isAdminRole) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (isHospitalStaffRole) {
      return <Navigate to="/hospital/sos-requests" replace />;
    }
    toast.info('Tài khoản Cán bộ Y tế đã được tự động chuyển hướng đến Cổng quản lý đợt hiến máu.');
    return <Navigate to="/bc/campaigns" replace />;
  }

  // 5. Fallback root redirect based on role
  if (location.pathname === '/') {
    if (isAdminRole) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (isHospitalStaffRole) {
      return <Navigate to="/hospital/sos-requests" replace />;
    }
    if (isBcStaffRole) {
      return <Navigate to="/bc/campaigns" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
