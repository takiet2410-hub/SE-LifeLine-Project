import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AccessRedirect: React.FC<{ to: string; message: string }> = ({ to, message }) => {
  useEffect(() => {
    toast.error(message, { id: `portal-access:${to}` });
  }, [message, to]);

  return <Navigate to={to} replace />;
};

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
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/news') ||
    location.pathname.startsWith('/donor') ||
    isSosAlertsRoute;

  const userRole = user?.role || 'Donor';
  const roleLower = userRole.toLowerCase();
  const userRoles = new Set([userRole, ...(Array.isArray(user?.roles) ? user.roles : [])]);

  const isBcStaffRole =
    userRoles.has('BloodCenterStaff') ||
    roleLower.includes('bloodcenter');

  const isHospitalStaffRole =
    userRoles.has('HospitalStaff') ||
    userRoles.has('Hospital') ||
    roleLower.includes('hospital');

  const isAdminRole =
    userRoles.has('Administrator') ||
    roleLower.includes('admin');

  const isDonorRole = userRole === 'Donor' || roleLower === 'donor';

  const isAdminRoute = location.pathname.startsWith('/admin');
  const portalRole = isAdminRole
    ? 'Administrator'
    : isHospitalStaffRole
    ? 'HospitalStaff'
    : isBcStaffRole
    ? 'BloodCenterStaff'
    : 'Donor';
  const portalHome = portalRole === 'Administrator'
    ? '/admin/dashboard'
    : portalRole === 'HospitalStaff'
    ? '/hospital/sos-requests'
    : portalRole === 'BloodCenterStaff'
    ? '/bc/campaigns'
    : '/my-appointments';

  // 1. System Admin Routes (/admin/*): Only Administrator allowed
  if (isAdminRoute && portalRole !== 'Administrator') {
    return (
      <AccessRedirect
        to={portalHome}
        message="Cảnh báo truy cập: Chỉ tài khoản Administrator mới có quyền truy cập Cổng Quản trị."
      />
    );
  }

  // 2. Blood Center portal is isolated from Hospital and System Admin portals.
  if (isBcRoute && portalRole !== 'BloodCenterStaff') {
    return (
      <AccessRedirect
        to={portalHome}
        message="Bạn đang đăng nhập bằng portal khác. Chỉ BloodCenterStaff được truy cập Cổng Trung tâm Máu."
      />
    );
  }

  // 3. Hospital portal is isolated from Blood Center and System Admin portals.
  if (isHospitalRoute && portalRole !== 'HospitalStaff') {
    return (
      <AccessRedirect
        to={portalHome}
        message="Bạn đang đăng nhập bằng portal khác. Chỉ HospitalStaff được truy cập Cổng Bệnh viện."
      />
    );
  }

  // 4. Strict Access Control: Donors routes access attempt by Staff/Admin
  if (isDonorRoute && !isDonorRole) {
    return (
      <AccessRedirect
        to={portalHome}
        message="Bạn đang đăng nhập bằng tài khoản công tác và đã được chuyển về đúng cổng quản lý."
      />
    );
  }

  // 5. Fallback root redirect based on role
  if (location.pathname === '/') {
    return <Navigate to={portalHome} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
