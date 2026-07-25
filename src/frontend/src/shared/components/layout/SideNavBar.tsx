import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Calendar, LayoutDashboard, Bell, Heart, LogOut } from 'lucide-react';
import { LifeLineLogo } from '../../../modules/auth-account/components/LifeLineLogo';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const SideNavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const userName = user?.fullName || 'Unknown User';
  
  const words = userName.trim().split(/\s+/);
  let initials = 'U';
  if (words.length >= 2) {
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    initials = words[0].substring(0, 2).toUpperCase();
  }
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Appointments', path: '/my-appointments', icon: Calendar },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'My Profile', path: '/profile', icon: Heart },
  ];

  return (
    <aside className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shrink-0">
      {/* Logo Area */}
      <div className="h-[72px] flex items-center px-6 border-b border-white/10 shrink-0">
        <Link to="/" className="flex items-center gap-2 group">
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
              onClick={(e) => {
                if (item.path === '/notifications') {
                  e.preventDefault();
                  toast.info('Tính năng Thông báo đang được phát triển!');
                }
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
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
