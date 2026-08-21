import React, { useState, useEffect, useRef } from 'react';
import { Bell, Globe, Menu, ShieldCheck, AlertTriangle, Calendar, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { apiService } from '../../services/apiClient';
import type { NotificationData } from '../../services/mockData';
import { format } from 'date-fns';
import { getArticleIdFromNotification, getArticleRouteForRole } from '../../utils/notificationHelpers';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userName = user?.fullName || 'BS. Nguyễn Văn A';
  const [unreadCount, setUnreadCount] = useState(0);

  // Notification Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'Administrator' || (user as any)?.roles?.includes('Administrator') || location.pathname.startsWith('/admin');
  const isHospital = user?.role === 'HospitalStaff' || user?.role?.toLowerCase().includes('hospital') || location.pathname.startsWith('/hospital');

  const words = userName.trim().split(/\s+/);
  let initials = isAdmin ? 'AD' : isHospital ? 'HS' : 'BC';
  if (words.length >= 2) {
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await apiService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {}
    };
    fetchCount();

    const handleUpdate = () => {
      fetchCount();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    const intervalId = setInterval(fetchCount, 10000);

    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
      clearInterval(intervalId);
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = async () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setLoadingNotifs(true);
      try {
        const result = await apiService.getNotifications({});
        // Show top 5 recent
        const sorted = result.data.sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()).slice(0, 5);
        setNotifications(sorted);
      } catch (err) {
        console.error('Failed to fetch dropdown notifications', err);
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleNotificationClick = async (notif: NotificationData) => {
    setIsDropdownOpen(false);
    if (!notif.readAt) {
      try {
        await apiService.markNotificationAsRead(notif._id);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, readAt: new Date().toISOString() } : n));
    }
    const articleId = getArticleIdFromNotification(notif);
    if (articleId) {
      navigate(getArticleRouteForRole(articleId, location.pathname));
      return;
    }

    if (isAdmin) {
      navigate(`/admin/notifications?id=${notif._id}`);
    } else if (isHospital) {
      navigate(`/hospital/notifications?id=${notif._id}`);
    } else {
      navigate(`/bc/notifications?id=${notif._id}`);
    }
  };

  const getIconForType = (type: string) => {
    switch (type as string) {
      case 'SOS': return <AlertTriangle className="w-4 h-4" />;
      case 'Appointment': return <Calendar className="w-4 h-4" />;
      case 'Campaign': return <Megaphone className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const getPageMeta = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) {
      return { title: 'Admin Dashboard', subtitle: 'MONITOR SYSTEM METRICS, ACTIVE SESSIONS & DIAGNOSTICS' };
    }
    if (path.includes('/admin/users')) {
      return { title: 'User Account Management', subtitle: 'MANAGE ACCOUNTS, ROLES & DEACTIVATIONS' };
    }
    if (path.includes('/admin/roles')) {
      return { title: 'Roles & Permissions', subtitle: 'CONFIGURE RBAC PERMISSIONS AND SYSTEM ACCESS' };
    }
    if (path.includes('/admin/logs')) {
      return { title: 'Activity Logs & Audit', subtitle: 'MONITOR AUDIT TRAIL, SECURITY EVENTS & EXPORTS' };
    }
    if (path.includes('/admin/config')) {
      return { title: 'System Configuration', subtitle: 'MANAGE GLOBAL ELIGIBILITY RULES & OPERATIONAL CONSTANTS' };
    }
    if (path.includes('/admin/toggles')) {
      return { title: 'Feature Toggles', subtitle: 'CONTROL SYSTEM FEATURE FLAGS & EXPERIMENTAL MODULES' };
    }
    // Blood Center Staff Routes (Tiếng Việt)
    if (path.includes('/campaigns/create')) {
      return { title: 'Tạo Chiến Dịch Hiến Máu Mới', subtitle: 'THIẾT LẬP THÔNG TIN, ĐỊA ĐIỂM VÀ LỊCH TIẾP NHẬN MÁU' };
    }
    if (path.includes('/registrations')) {
      return { title: 'Danh Sách Người Đăng Ký & Phê Duyệt Sàng Lọc', subtitle: 'RÀ SOÁT HỒ SƠ NGƯỜI HIẾN, LỊCH HẸN VÀ KẾT QUẢ SÀNG LỌC' };
    }
    if (path.includes('/qr-scan')) {
      return { title: 'Quét Mã QR & Check-in', subtitle: 'XÁC THỰC VÉ E-TICKET VÀ TIẾP NHẬN NGƯỜI HIẾN MÁU' };
    }
    if (path.includes('/inventory/stock-in')) {
      return { title: 'Nhập Túi Máu Vào Kho', subtitle: 'TIẾP NHẬN TÚI MÁU MỚI TỪ CHIẾN DỊCH HOẶC HIẾN TRỰC TIẾP' };
    }
    if (path.includes('/inventory/stock-out')) {
      return { title: 'Xuất Túi Máu Khỏi Kho', subtitle: 'ĐIỀU PHỐI TÚI MÁU CHO BỆNH VIỆN VÀ CẤP CỨU SOS' };
    }
    if (path.includes('/inventory/stats')) {
      return { title: 'Thống Kê Kho Máu & Phân Tích', subtitle: 'BÁO CÁO CƠ CẤU NHÓM MÁU, HẠN SỬ DỤNG VÀ BIẾN ĐỘNG KHO' };
    }
    if (path.includes('/inventory')) {
      return { title: 'Quản Lý Kho Máu & Tồn Trữ', subtitle: 'THEO DÕI VỊ TRÍ LƯU TRỮ, CẢNH BÁO HẠN DÙNG FEFO VÀ ĐIỀU PHỐI XUẤT NHẬP KHO' };
    }
    if (path.includes('/content/create')) {
      return { title: 'Tạo Bài Viết & Thông Báo Mới', subtitle: 'SOẠN THẢO BÀI VIẾT, HƯỚNG DẪN HOẶC CẢNH BÁO KHẨN CẤP' };
    }
    if (path.includes('/content')) {
      return { title: 'Quản Lý Nội Dung & Tin Tức', subtitle: 'XUẤT BẢN BÀI VIẾT, CẨM NANG SỨC KHỎE VÀ THÔNG BÁO' };
    }
    if (path.includes('/sos-requests')) {
      return { title: 'Yêu Cầu Cấp Cứu SOS', subtitle: 'TIẾP NHẬN VÀ ĐIỀU PHỐI MÁU CẤP CỨU CHO CÁC BỆNH VIỆN ĐỐI TÁC' };
    }
    if (path.includes('/notifications')) {
      return { title: 'Thông Báo Hệ Thống & Cảnh Báo', subtitle: 'TIẾP NHẬN YÊU CẦU CẤP CỨU KHẨN CẤP VÀ CẢNH BÁO VẬN HÀNH' };
    }
    return { title: 'Quản Lý Chiến Dịch & Phê Duyệt Đăng Ký', subtitle: 'ĐIỀU PHỐI CÁC ĐỢT TIẾP NHẬN MÁU LƯU ĐỘNG, RÀ SOÁT VÀ PHÊ DUYỆT ĐĂNG KÝ' };
  };

  const pageMeta = getPageMeta();

  return (
    <header className="h-16 sm:h-[72px] bg-white border-b border-[#f1f3f5] px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Mobile Toggle & Page Header Titles */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-2 text-[#6c757d] hover:text-[#271816] rounded-lg cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="sm:hidden truncate text-sm font-bold text-[#271816]">{pageMeta.title}</span>
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-bold text-[#271816] leading-tight">
              {pageMeta.title}
            </h1>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border flex items-center gap-1 ${
              isAdmin
                ? 'text-purple-700 bg-purple-50 border-purple-200'
                : isHospital
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-[#93000b] bg-red-50 border-red-100'
            }`}>
              <ShieldCheck className={`w-3 h-3 ${isAdmin ? 'text-purple-700' : isHospital ? 'text-emerald-700' : 'text-[#93000b]'}`} />
              {isAdmin ? 'System Admin' : isHospital ? 'Hospital Portal' : 'Cổng Nhân Viên'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-[#6c757d] uppercase tracking-wider mt-0.5">
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3.5">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[12px] sm:text-[13px] font-semibold text-[#5b403d] border border-[#f1f3f5] hover:bg-[#fff8f7] transition-colors cursor-pointer"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#93000b]" />
          <span>{i18n.language.toUpperCase()}</span>
        </button>

        {/* SOS Alert Bell & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="relative p-2 text-[#6c757d] hover:text-[#271816] hover:bg-[#f8f9fa] rounded-full transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-4 bg-[#93000b] rounded-full ring-2 ring-white flex items-center justify-center px-1 text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              
              <div className="max-h-[320px] overflow-y-auto">
                {loadingNotifs ? (
                  <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">No new notifications</div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => {
                      const isUnread = !notif.readAt;
                      const isSOS = notif.type === 'SOS';
                      return (
                        <div 
                          key={notif._id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${isUnread ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSOS ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                            {getIconForType(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {notif.title}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{notif.body}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {notif.createdAt ? (() => {
                                try {
                                  return format(new Date(notif.createdAt), 'dd/MM HH:mm');
                                } catch (e) {
                                  return 'N/A';
                                }
                              })() : ''}
                            </span>
                          </div>
                          {!notif.readAt && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2"></div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate(isAdmin ? '/admin/logs' : isHospital ? '/hospital/sos-requests' : '/bc/notifications');
                  }}
                  className="w-full py-2 text-center text-sm font-semibold text-[#93000b] hover:bg-red-50 rounded-lg transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-1.5 sm:pl-3 border-l border-[#f1f3f5]">
          <div className="w-9 h-9 rounded-full bg-[#1a1a2e] text-white font-bold text-[13px] flex items-center justify-center border border-[#dee2e6] shadow-xs">
            {initials}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[13px] font-bold text-[#271816] leading-tight truncate max-w-[130px]">
              {userName}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isAdmin ? 'text-purple-600' : isHospital ? 'text-emerald-600' : 'text-[#93000b]'}`}>
              {user?.role || (isAdmin ? 'Administrator' : isHospital ? 'HospitalStaff' : 'BloodCenterStaff')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
