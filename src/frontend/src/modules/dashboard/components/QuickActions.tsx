import React from 'react';
import { Calendar, MapPin, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const QuickActions: React.FC = () => {
  const { t } = useTranslation();
  
  const actions = [
    {
      label: t('dashboard.quickActions.schedule'),
      icon: Calendar,
      to: '/my-appointments/schedule',
      isPrimary: false,
    },
    {
      label: t('dashboard.quickActions.findHospital'),
      icon: MapPin,
      to: '/map',
      isPrimary: false,
    },
    {
      label: t('dashboard.quickActions.history'),
      icon: History,
      to: '/profile',
      isPrimary: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link
            key={idx}
            to={action.to}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
              action.isPrimary 
                ? 'bg-[#93000b] text-white border-[#93000b] hover:bg-[#7a0009]' 
                : 'bg-white text-[#271816] border-[#f1f3f5] hover:border-[#93000b]/30'
            }`}
          >
            <div className={`p-2 rounded-lg ${action.isPrimary ? 'bg-white/20' : 'bg-[#fff8f7]'}`}>
              <Icon className={`w-6 h-6 ${action.isPrimary ? 'text-white' : 'text-[#93000b]'}`} />
            </div>
            <span className="font-semibold text-[15px]">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
