import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { getProfile } from '../../auth-account/api/authApi';

export const WelcomeHero: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await getProfile();
      if (res.success) {
        setProfileData(res.user);
      }
    };
    fetchProfile();
  }, []);

  let statusText = t('dashboard.welcome.loading');
  let daysLeft = 0;
  let progressPercent = 0;
  let nextDateStr = '---';

  if (profileData && profileData.donationImpact) {
    const status = profileData.donationImpact.status;
    if (status === 'Eligible Now') {
      statusText = t('dashboard.welcome.timeMet');
      progressPercent = 100;
      nextDateStr = t('dashboard.welcome.timeMetShort');
    } else if (status.startsWith('Eligible on')) {
      nextDateStr = status.replace('Eligible on ', '');
      const parts = nextDateStr.split('/');
      if (parts.length === 3) {
        const nextDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const today = new Date();
        const diffTime = nextDate.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) daysLeft = 0;
        
        statusText = t('dashboard.welcome.eligibleIn', { days: daysLeft });
        progressPercent = Math.max(0, Math.min(100, ((84 - daysLeft) / 84) * 100));
      }
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
      <div>
        <h1 className="text-[28px] font-bold text-[#271816] mb-2">
          {t('dashboard.welcome.title', { name: user?.fullName || 'bạn' })}
        </h1>
        <p className="text-[#6c757d] italic">{t('dashboard.welcome.quote')}</p>
      </div>
      
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#f1f3f5] w-full md:w-auto min-w-[300px]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[15px] font-semibold text-[#271816]">{t('dashboard.welcome.eligibility')}</span>
          <Calendar className="w-5 h-5 text-[#93000b]" />
        </div>
        <div className="text-[18px] font-bold text-[#93000b] mb-3">{nextDateStr}</div>
        <div className="w-full bg-[#fff8f7] rounded-full h-2.5 mb-2 overflow-hidden border border-[#f1f3f5]">
          <div className="bg-[#93000b] h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="text-[13px] text-right text-[#6c757d] font-medium">{statusText}</div>
      </div>
    </div>
  );
};

