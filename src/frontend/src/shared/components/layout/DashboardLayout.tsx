import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { SideNavBar } from './SideNavBar';
import { Bell, Menu, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ScheduleProvider } from '../../../modules/booking-location/context/ScheduleContext';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../services/apiClient';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const userName = user?.fullName || 'User';

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await apiService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

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

            <Link to="/notifications" className="relative p-2 text-[#6c757d] hover:text-[#271816] hover:bg-[#f8f9fa] rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#93000b] rounded-full border border-white flex items-center justify-center px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            
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
