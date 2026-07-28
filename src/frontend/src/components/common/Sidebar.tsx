import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Package,
  FileText,
  Bell,
  LogOut,
  Building2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../shared/contexts/AuthContext';
import { LifeLineLogo } from '../../modules/auth-account/components/LifeLineLogo';

interface SidebarProps {
  unreadNotifCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ unreadNotifCount = 3 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userName = user?.fullName || 'BS. Nguyễn Văn A';

  const words = userName.trim().split(/\s+/);
  let initials = 'BC';
  if (words.length >= 2) {
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/bc/campaigns',
      label: t('common.campaigns') || 'Campaign Management',
      icon: Calendar,
    },
    {
      to: '/bc/inventory',
      label: t('common.inventory') || 'Inventory Management',
      icon: Package,
    },
    {
      to: '/bc/content',
      label: t('common.content') || 'Content Management',
      icon: FileText,
    },
    {
      to: '/bc/notifications',
      label: t('common.notifications') || 'Notifications & SOS',
      icon: Bell,
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
    },
  ];

  return (
    <aside className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shrink-0 selection:bg-[#93000b]/30">
      {/* Brand Header Logo */}
      <div className="h-[72px] flex items-center px-6 border-b border-white/10 shrink-0 justify-between">
        <Link to="/bc/campaigns" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#93000b] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm shadow-[#93000b]/40">
            <LifeLineLogo className="w-5 h-6 text-white" />
          </div>
          <div>
            <span className="text-[19px] font-bold text-white tracking-tight leading-none block">
              LifeLine
            </span>
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block mt-0.5">
              Blood Center
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Management Portal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#93000b] text-white shadow-sm shadow-[#93000b]/40 font-semibold'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-[#93000b] text-white rounded-full border border-white/20">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Staff User Profile Footer */}
      <div className="p-4 border-t border-white/10 bg-[#161628]">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-9 h-9 rounded-full bg-[#93000b]/80 border border-white/20 flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
            <p className="text-[11px] text-red-400 font-medium truncate flex items-center gap-1">
              <Building2 className="w-3 h-3 shrink-0" />
              BloodCenterStaff
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-[#a3a3a3] hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
