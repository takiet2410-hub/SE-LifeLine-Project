import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Package,
  FileText,
  Bell,
  LogOut,
  Building2,
  LayoutDashboard,
  Users,
  Shield,
  Sliders,
  ToggleLeft,
  HeartPulse,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../shared/contexts/AuthContext';
import { LifeLineLogo } from '../../modules/auth-account/components/LifeLineLogo';
import { apiService } from '../../services/apiClient';
import { useState, useEffect } from 'react';

interface SidebarProps {
  unreadNotifCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ unreadNotifCount: initialUnreadCount }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userName = user?.fullName || 'Administrator';
  
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount || 0);

  useEffect(() => {
    if (initialUnreadCount !== undefined) return;
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
  }, [initialUnreadCount]);

  const words = userName.trim().split(/\s+/);
  let initials = 'AD';
  if (words.length >= 2) {
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'Administrator' || (user as any)?.roles?.includes('Administrator') || location.pathname.startsWith('/admin');
  const isHospital = user?.role === 'HospitalStaff' || user?.role?.toLowerCase().includes('hospital') || location.pathname.startsWith('/hospital');

  const navItems = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
        { to: '/admin/users', label: 'User Accounts', icon: Users },
        { to: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
        { to: '/admin/logs', label: 'Activity Logs', icon: FileText },
        { to: '/admin/content', label: 'Content & News Feed', icon: FileText },
        {
          to: '/admin/notifications',
          label: 'Notifications & SOS',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        { to: '/admin/config', label: 'System Configuration', icon: Sliders },
        { to: '/admin/toggles', label: 'Feature Toggles', icon: ToggleLeft },
      ]
    : isHospital
    ? [
        { to: '/hospital/sos-requests', label: 'SOS Requests', icon: Bell },
        { to: '/hospital/sos-reports', label: 'SOS Reports', icon: FileText },
        { to: '/hospital/content', label: t('common.content') || 'Content & News', icon: FileText },
        {
          to: '/hospital/notifications',
          label: t('common.notifications') || 'Notifications & SOS',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
      ]
    : [
        { to: '/bc/campaigns', label: t('common.campaigns') || 'Campaign Management', icon: Calendar },
        { to: '/bc/inventory', label: t('common.inventory') || 'Inventory Management', icon: Package },
        { to: '/bc/sos-requests', label: 'SOS Requests', icon: HeartPulse },
        { to: '/bc/content', label: t('common.content') || 'Content Management', icon: FileText },
        {
          to: '/bc/notifications',
          label: t('common.notifications') || 'Notifications & SOS',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
      ];

  return (
    <aside className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shrink-0 selection:bg-[#93000b]/30">
      {/* Brand Header Logo */}
      <div className="h-[72px] flex items-center px-6 border-b border-white/10 shrink-0 justify-between">
        <Link to={isAdmin ? "/admin/dashboard" : isHospital ? "/hospital/sos-requests" : "/bc/campaigns"} className="flex items-center gap-2.5 group">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${
            isAdmin ? 'bg-purple-700 shadow-purple-700/40' : isHospital ? 'bg-emerald-700 shadow-emerald-700/40' : 'bg-[#93000b] shadow-[#93000b]/40'
          }`}>
            <LifeLineLogo className="w-5 h-6 text-white" />
          </div>
          <div>
            <span className="text-[19px] font-bold text-white tracking-tight leading-none block">
              LifeLine
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-widest block mt-0.5 ${
              isAdmin ? 'text-purple-400' : isHospital ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {isAdmin ? 'System Admin' : isHospital ? 'Hospital' : 'Blood Center'}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          {isAdmin ? 'Admin Portal' : isHospital ? 'Hospital Portal' : 'Management Portal'}
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
          <div className={`w-9 h-9 rounded-full border border-white/20 flex items-center justify-center shrink-0 ${
            isAdmin ? 'bg-purple-800/80' : isHospital ? 'bg-emerald-800/80' : 'bg-[#93000b]/80'
          }`}>
            <span className="text-[13px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
            <p className={`text-[11px] font-medium truncate flex items-center gap-1 ${
              isAdmin ? 'text-purple-300' : isHospital ? 'text-emerald-300' : 'text-red-400'
            }`}>
              {isAdmin ? <Shield className="w-3 h-3 shrink-0" /> : <Building2 className="w-3 h-3 shrink-0" />}
              {user?.role || (isAdmin ? 'Administrator' : isHospital ? 'HospitalStaff' : 'BloodCenterStaff')}
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
