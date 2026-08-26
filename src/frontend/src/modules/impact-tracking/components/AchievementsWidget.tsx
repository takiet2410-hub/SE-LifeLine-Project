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
      title: 'Giọt Đầu Tiên',
      description: 'Hoàn thành lần hiến máu đầu tiên',
      bg: 'bg-[#EF4444] text-white',
      icon: '🩸',
      active: unlockedTypes.has('FirstDonation') || donations >= 1
    },
    {
      type: 'Silver',
      title: 'Hạng Bạc',
      description: 'Đạt mốc 500 XP',
      bg: 'bg-[#9CA3AF] text-white',
      icon: '🥈',
      active: xp >= 500
    },
    {
      type: 'Gold',
      title: 'Hạng Vàng',
      description: 'Đạt mốc 1000 XP',
      bg: 'bg-[#FBBF24] text-white',
      icon: '🥇',
      active: xp >= 1000
    },
    {
      type: 'Platinum',
      title: 'Hạng Bạch Kim',
      description: 'Đạt mốc 2000 XP',
      bg: 'bg-[#38BDF8] text-white',
      icon: '💎',
      active: xp >= 2000
    },
    {
      type: 'Diamond',
      title: 'Hạng Kim Cương',
      description: 'Đạt mốc 5000 XP',
      bg: 'bg-[#8B5CF6] text-white',
      icon: '👑',
      active: xp >= 5000
    },
    {
      type: 'Legendary',
      title: 'Hạng Huyền Thoại',
      description: 'Đạt mốc 10000 XP',
      bg: 'bg-[#EC4899] text-white',
      icon: '🌟',
      active: xp >= 10000
    }
  ];

  const unlockedCount = badges.filter(b => b.active).length;

  return (
    <div className="flex p-6 flex-col items-start gap-6 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-[#271816] font-inter text-base font-bold leading-6">Cấp Bậc & Huy Hiệu</h3>
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
    </div>
  );
};
