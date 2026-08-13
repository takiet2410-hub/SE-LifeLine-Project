import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SideNavBar } from './SideNavBar';
import { Bell, Menu, Globe, AlertTriangle, Calendar, Megaphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ScheduleProvider } from '../../../modules/booking-location/context/ScheduleContext';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../services/apiClient';
import type { NotificationData } from '../../../services/mockData';
import { format } from 'date-fns';


export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Notification Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const userName = user?.fullName || 'User';

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await apiService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {}
    };
    fetchCount();
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

    // Direct redirect to specific article page if notification is for an article
    const articleId = notif.payload?.articleId || (notif.sourceRefType === 'Article' ? notif.sourceRefId : null);
    if (articleId) {
      navigate(`/news/${articleId}`);
      return;
    }

    if (notif.type === 'SOS' || notif.sourceRefType === 'SOSRequest') {
      navigate('/sos-alerts');
    } else if ((notif.type as string) === 'Appointment' || notif.sourceRefType === 'Appointment') {
      navigate('/my-appointments');
    } else {
      navigate('/news');
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
  
  // Hàm lấy Initials (2 chữ cái đầu)
  const words = userName.trim().split(/\s+/);
  let initials = 'U';
  if (words.length >= 2) {
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  return (
    <ScheduleProvider>
      <div className="flex h-screen w-full bg-[#fff8f7] overflow-hidden selection:bg-[#93000b]/20">
      {/* Sidebar - Hidden on mobile, handled by media queries if needed later */}
      <div className="hidden md:flex">
        <SideNavBar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-[#f1f3f5] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 text-[#6c757d] hover:text-[#271816] rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-[20px] font-bold text-[#271816] leading-tight">
                {location.pathname.includes('/map')
                  ? t('dashboardHeader.title.map')
                  : location.pathname.includes('/schedule') 
                    ? t('dashboardHeader.title.schedule') 
                    : location.pathname.includes('/my-appointments') 
                      ? t('dashboardHeader.title.myAppointments') 
                      : location.pathname.includes('/profile')
                        ? t('dashboardHeader.title.profile')
                        : location.pathname.includes('/news')
                          ? t('dashboardHeader.title.news')
                          : location.pathname.includes('/notifications')
                            ? t('dashboardHeader.title.notifications')
                            : location.pathname.includes('/sos-alerts')
                              ? t('dashboardHeader.title.sosAlerts')
                              : t('dashboardHeader.title.dashboard')}
              </h1>
              <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">
                {location.pathname.includes('/map')
                  ? t('dashboardHeader.subtitle.map')
                  : location.pathname.includes('/schedule') 
                    ? t('dashboardHeader.subtitle.schedule')
                    : location.pathname.includes('/my-appointments') 
                      ? t('dashboardHeader.subtitle.myAppointments') 
                      : location.pathname.includes('/profile')
                        ? t('dashboardHeader.subtitle.profile')
                        : location.pathname.includes('/news')
                          ? t('dashboardHeader.subtitle.news')
                          : location.pathname.includes('/notifications')
                            ? t('dashboardHeader.subtitle.notifications')
                            : location.pathname.includes('/sos-alerts')
                              ? t('dashboardHeader.subtitle.sosAlerts')
                              : t('dashboardHeader.subtitle.dashboard')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-[#5b403d] border border-[#f1f3f5] hover:bg-[#fff8f7] transition-colors cursor-pointer"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#93000b]" />
              <span>{i18n.language.toUpperCase()}</span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button onClick={toggleDropdown} className="relative p-2 text-[#6c757d] hover:text-[#271816] hover:bg-[#f8f9fa] rounded-full transition-colors cursor-pointer">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#93000b] rounded-full border border-white flex items-center justify-center px-1 text-[9px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
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
                        navigate('/notifications');
                      }}
                      className="w-full py-2 text-center text-sm font-semibold text-[#93000b] hover:bg-red-50 rounded-lg transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center border border-[#dee2e6]">
              <span className="text-[12px] font-bold text-white">{initials}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#fff8f7]">
          <Outlet />
        </main>
      </div>
    </div>
    </ScheduleProvider>
  );
};
