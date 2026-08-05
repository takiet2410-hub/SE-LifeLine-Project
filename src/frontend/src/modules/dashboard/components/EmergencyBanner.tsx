import React from 'react';
import { AlertCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const EmergencyBanner: React.FC = () => {
  const { t } = useTranslation();
  
  // In a real app, this would be fetched from an API
  const emergency = {
    hospital: 'Bệnh viện Đa khoa Đà Nẵng',
    bloodTypes: ['O+', 'A-'],
  };

  if (!emergency) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-red-700 font-bold text-[16px] mb-1">{t('dashboard.emergency.title')}</h3>
          <p className="text-red-600 text-[14px]">
            <span className="font-semibold">{emergency.hospital}</span> {t('dashboard.emergency.needsBlood')}{' '}
            <span className="font-bold bg-white px-2 py-0.5 rounded text-red-700 border border-red-200 ml-1">
              {emergency.bloodTypes.join(', ')}
            </span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Link 
          to="/my-appointments/schedule" 
          className="flex-1 md:flex-none text-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-[14px] shadow-sm"
        >
          {t('dashboard.emergency.action')}
        </Link>
        <Link 
          to="/map" 
          className="p-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
          title={t('dashboard.emergency.viewMap')}
        >
          <MapPin className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};
