import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Package,
  FileText,
  Bell,
  Heart,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  unreadNotifCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ unreadNotifCount = 3 }) => {
  const { t } = useTranslation();

  const navItems = [
    {
      to: '/bc/campaigns',
      label: t('common.campaigns'),
      icon: Calendar,
    },
    {
      to: '/bc/inventory',
      label: t('common.inventory'),
      icon: Package,
    },
    {
      to: '/bc/content',
      label: t('common.content'),
      icon: FileText,
    },
    {
      to: '/bc/notifications',
      label: t('common.notifications'),
      icon: Bell,
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-900/30">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-white">LifeLine</h1>
            <p className="text-[11px] text-red-400 font-medium tracking-wider uppercase">Blood Center Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm shadow-red-900/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Staff User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 font-bold text-sm">
            BC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">BS. Nguyễn Văn A</p>
            <p className="text-xs text-slate-400 truncate">Trung tâm Huyết học TP.HCM</p>
          </div>
          <button className="text-slate-400 hover:text-red-400 transition-colors p-1" title={t('common.logout')}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
