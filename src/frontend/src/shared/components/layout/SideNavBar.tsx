import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Calendar, LayoutDashboard, Bell, Heart, LogOut, Map, Newspaper, AlertTriangle } from 'lucide-react';
import { LifeLineLogo } from '../../../modules/auth-account/components/LifeLineLogo';
import { useAuth } from '../../contexts/AuthContext';

import { useTranslation } from 'react-i18next';

export const SideNavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const userName = user?.fullName || 'Unknown User';
  
  const words = userName.trim().split(/\s+/);
  let initials = 'U';
  if (words.length >= 2) {
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    initials = words[0].substring(0, 2).toUpperCase();
  }
  const navItems = [
    { name: t('donorNav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('donorNav.map'), path: '/map', icon: Map },
    { name: t('donorNav.myAppointments'), path: '/my-appointments', icon: Calendar },
    { name: t('donorNav.newsFeed'), path: '/news', icon: Newspaper },
    { name: t('donorNav.notifications'), path: '/notifications', icon: Bell },
    { name: t('donorNav.sosAlerts'), path: '/sos-alerts', icon: AlertTriangle },

    { name: t('donorNav.myProfile'), path: '/profile', icon: Heart },
  ];

  return (
    <aside className="w-full md:w-64 h-dvh bg-[#1a1a2e] text-white flex flex-col shrink-0">
      {/* Logo Area */}
      <div className="h-[72px] flex items-center px-6 border-b border-white/10 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[#93000b] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <LifeLineLogo className="w-5 h-6 text-white" />
          </div>
          <span className="text-[20px] font-bold text-white tracking-tight">
            LifeLine
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#93000b] text-white'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-[#2c2c44] flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
            <span className="text-[14px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white truncate">{userName}</p>
            <p className="text-[12px] text-[#a3a3a3] truncate">Donor</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-[#a3a3a3] hover:text-[#93000b] hover:bg-white/5 rounded-lg transition-colors"
            title={t('donorNav.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
