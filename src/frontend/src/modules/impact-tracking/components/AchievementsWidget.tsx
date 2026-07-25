import React from 'react';
import type { ProfileData } from './ProfileHeaderCard';

interface AchievementsWidgetProps {
  profileData?: ProfileData | null;
}

export const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({ profileData }) => {
  const donations = profileData?.donationImpact?.totalDonations || 0;
  const xp = profileData?.donationImpact?.xp || 0;

  const badges = [
    { title: 'First Drop', bg: 'bg-[#EF4444]', icon: '🩸', active: donations >= 1 },
    { title: 'Silver Donor', bg: 'bg-[#F59E0B]', icon: '🏅', active: xp >= 200 },
    { title: 'Prompt Donor', bg: 'bg-[#3B82F6]', icon: '🕒', active: donations >= 3 },
    { title: 'Gallon Club', bg: 'bg-[#F1F3F5]', icon: '🥛', active: donations >= 8 },
    { title: 'Ambassador', bg: 'bg-[#F1F3F5]', icon: '👥', active: false },
    { title: 'Emergency Responder', bg: 'bg-[#F1F3F5]', icon: '⭐', active: false }
  ];

  const unlockedCount = badges.filter(b => b.active).length;

  return (
    <div className="flex p-6 flex-col items-start gap-6 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-[#271816] font-inter text-base font-bold leading-6">Achievements</h3>
        <span className="text-[#6C757D] font-inter text-[10px] font-bold tracking-widest uppercase">{unlockedCount} / {badges.length}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-y-6 w-full place-items-center">
        {badges.map((badge, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${badge.active ? badge.bg : 'bg-[#F1F3F5] opacity-50 grayscale'}`}>
              {badge.icon}
            </div>
            <span className="text-center text-[10px] font-medium text-[#6C757D] w-14 leading-tight">{badge.title}</span>
          </div>
        ))}
      </div>
      
      <button className="flex py-2 justify-center items-center rounded-lg border border-[#DEE2E6] w-full mt-2 hover:bg-gray-50 transition-colors">
        <span className="text-[#6C757D] font-inter text-sm font-medium">Discover More</span>
      </button>
    </div>
  );
};
