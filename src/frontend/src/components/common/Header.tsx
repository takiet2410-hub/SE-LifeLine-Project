import React from 'react';
import { Bell, Globe, Menu, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userName = user?.fullName || 'BS. Nguyễn Văn A';

  const words = userName.trim().split(/\s+/);
  let initials = 'BC';
  if (words.length >= 2) {
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const getPageMeta = () => {
    const path = location.pathname;
    if (path.includes('/inventory')) {
      return {
        title: 'Blood Inventory Management',
        subtitle: 'MONITOR BLOOD BAG STOCK, FEFO EXPIRATION & DISPATCH',
      };
    }
    if (path.includes('/content')) {
      return {
        title: 'Content Management',
        subtitle: 'PUBLISH HEALTH ARTICLES & EMERGENCY BLOOD ALERTS',
      };
    }
    if (path.includes('/notifications')) {
      return {
        title: 'Notifications & Emergency SOS',
        subtitle: 'REVIEW CRITICAL HOSPITAL REQUESTS AND SYSTEM ALERTS',
      };
    }
    return {
      title: 'Campaign Management',
      subtitle: 'COORDINATE MOBILE DONATION DRIVES & MONITOR CAPACITY',
    };
  };

  const pageMeta = getPageMeta();

  return (
    <header className="h-[72px] bg-white border-b border-[#f1f3f5] px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Mobile Toggle & Page Header Titles */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-2 text-[#6c757d] hover:text-[#271816] rounded-lg cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-bold text-[#271816] leading-tight">
              {pageMeta.title}
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold text-[#93000b] bg-red-50 rounded-md border border-red-100 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#93000b]" />
              Staff Portal
            </span>
          </div>
          <p className="text-[11px] font-semibold text-[#6c757d] uppercase tracking-wider mt-0.5">
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3.5">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-[#5b403d] border border-[#f1f3f5] hover:bg-[#fff8f7] transition-colors cursor-pointer"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#93000b]" />
          <span>{i18n.language.toUpperCase()}</span>
        </button>

        {/* SOS Alert Bell Quick Link */}
        <button
          onClick={() => navigate('/bc/notifications')}
          className="relative p-2 text-[#6c757d] hover:text-[#271816] hover:bg-[#f8f9fa] rounded-full transition-colors cursor-pointer"
          title={t('common.notifications') || 'Notifications'}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-[#93000b] rounded-full ring-2 ring-white animate-pulse"></span>
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#f1f3f5]">
          <div className="w-9 h-9 rounded-full bg-[#1a1a2e] text-white font-bold text-[13px] flex items-center justify-center border border-[#dee2e6] shadow-xs">
            {initials}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[13px] font-bold text-[#271816] leading-tight truncate max-w-[130px]">
              {userName}
            </span>
            <span className="text-[10px] text-[#93000b] font-semibold uppercase tracking-wider">
              BloodCenterStaff
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
