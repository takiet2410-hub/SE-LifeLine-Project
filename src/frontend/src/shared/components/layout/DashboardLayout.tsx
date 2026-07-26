import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SideNavBar } from './SideNavBar';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ScheduleProvider } from '../../../modules/booking-location/context/ScheduleContext';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const userName = user?.fullName || 'User';
  
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
                  ? 'Map'
                  : location.pathname.includes('/schedule') 
                    ? 'Schedule Appointment' 
                    : location.pathname.includes('/my-appointments') 
                      ? 'My Appointments' 
                      : location.pathname.includes('/profile')
                        ? 'My Profile & Donation Impact'
                        : 'Dashboard'}
              </h1>
              <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">
                {location.pathname.includes('/map')
                  ? 'FIND DONATION CENTERS AND ACTIVE CAMPAIGNS NEAR YOU'
                  : location.pathname.includes('/schedule') 
                    ? 'BOOK A NEW DONATION OR SCREENING'
                    : location.pathname.includes('/my-appointments') 
                      ? 'MANAGE YOUR LIFE-SAVING SCHEDULE' 
                      : location.pathname.includes('/profile')
                        ? 'Track your life-saving journey and achievements'
                        : 'OVERVIEW'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#6c757d] hover:text-[#271816] hover:bg-[#f8f9fa] rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#93000b] rounded-full border border-white"></span>
            </button>
            
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
