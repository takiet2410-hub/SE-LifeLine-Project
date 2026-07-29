import React from 'react';
import type { ProfileData } from './ProfileHeaderCard';

interface AchievementsWidgetProps {
  profileData?: ProfileData | null;
}

export const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({ profileData }) => {
  const donations = profileData?.donationImpact?.totalDonations || 0;
  const xp = profileData?.donationImpact?.xp || 0;
  const unlockedTypes = new Set((profileData?.achievements || []).map(a => a.badgeType));

  const badges = [
    {
      type: 'FirstDonation',
      title: 'First Drop',
      description: 'Hoàn thành lần hiến máu đầu tiên',
      bg: 'bg-[#EF4444] text-white',
      icon: '🩸',
      active: unlockedTypes.has('FirstDonation') || donations >= 1
    },
    {
      type: 'SilverDonor',
      title: 'Silver Donor',
      description: 'Đạt mốc 200 XP đóng góp cộng đồng',
      bg: 'bg-[#F59E0B] text-white',
      icon: '🏅',
      active: unlockedTypes.has('SilverDonor') || xp >= 200
    },
    {
      type: 'PromptDonor',
      title: 'Prompt Donor',
      description: 'Hoàn thành 3 lần hiến máu đúng lịch',
      bg: 'bg-[#3B82F6] text-white',
      icon: '🕒',
      active: unlockedTypes.has('PromptDonor') || donations >= 3
    },
    {
      type: 'FiveDonations',
      title: 'Loyal Donor',
      description: 'Hoàn thành 5 lần hiến máu tình nguyện',
      bg: 'bg-[#8B5CF6] text-white',
      icon: '🎖️',
      active: unlockedTypes.has('FiveDonations') || donations >= 5
    },
    {
      type: 'GallonClub',
      title: 'Gallon Club',
      description: 'Hoàn thành 8 lần hiến máu xuất sắc',
      bg: 'bg-[#10B981] text-white',
      icon: '🥛',
      active: unlockedTypes.has('GallonClub') || donations >= 8
    },
    {
      type: 'EmergencyResponder',
      title: 'Emergency Responder',
      description: 'Tham gia ứng cứu khẩn cấp hoặc đạt 10 lần hiến máu',
      bg: 'bg-[#EC4899] text-white',
      icon: '⭐',
      active: unlockedTypes.has('EmergencyResponder') || donations >= 10
    }
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
          <div key={idx} className="group relative flex flex-col items-center gap-2 cursor-pointer">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-200 transform group-hover:scale-110 shadow-sm ${badge.active ? badge.bg : 'bg-[#F1F3F5] text-gray-400 opacity-50 grayscale'}`}>
              {badge.icon}
            </div>
            <span className="text-center text-[10px] font-medium text-[#6C757D] w-16 leading-tight group-hover:text-[#271816] transition-colors">{badge.title}</span>

            {/* Hover Tooltip Details */}
            <div className="absolute bottom-full mb-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-30 w-48 p-3 bg-[#1e293b] text-white text-xs rounded-xl shadow-xl flex flex-col gap-1 items-center text-center">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>{badge.icon}</span>
                <span>{badge.title}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-tight mt-0.5">{badge.description}</p>
              <div className={`mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${badge.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                {badge.active ? '✓ Đã đạt được' : '🔒 Chưa đạt được'}
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1e293b] rotate-45"></div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="flex py-2 justify-center items-center rounded-lg border border-[#DEE2E6] w-full mt-2 hover:bg-gray-50 transition-colors">
        <span className="text-[#6C757D] font-inter text-sm font-medium">Discover More</span>
      </button>
    </div>
  );
};
