import React from 'react';
import type { ProfileData } from './ProfileHeaderCard';

interface CurrentProgressProps {
  profileData?: ProfileData | null;
}

export const CurrentProgress: React.FC<CurrentProgressProps> = ({ profileData }) => {
  // Lấy dữ liệu thật hoặc default 0
  const xp = profileData?.donationImpact?.xp || 0;
  
  // Logic level rất cơ bản
  let maxXP = 500;
  let levelName = 'BRONZE DONOR';
  let nextLevel = 'Silver Rank';
  
  if (xp >= 1000) {
    maxXP = 2000;
    levelName = 'PLATINUM DONOR';
    nextLevel = 'Diamond Rank';
  } else if (xp >= 500) {
    maxXP = 1000;
    levelName = 'GOLD DONOR';
    nextLevel = 'Platinum Rank';
  } else if (xp >= 200) {
    maxXP = 500;
    levelName = 'SILVER DONOR';
    nextLevel = 'Gold Rank';
  }

  const xpNeeded = maxXP - xp;
  const progressPercent = Math.min((xp / maxXP) * 100, 100);

  return (
    <div className="flex p-6 flex-col items-start gap-4 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
      <h3 className="text-[#271816] font-inter text-base font-bold leading-6">Current Progress</h3>
      
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center w-full">
          <span className="text-[#6C757D] font-inter text-[10px] font-bold tracking-widest uppercase">LEVEL: {levelName}</span>
          <span className="text-[#271816] font-inter text-[10px] font-bold tracking-widest uppercase">{xp} / {maxXP} XP</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
          <div className="h-full bg-[#93000B] rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
      
      <div className="flex p-4 flex-col gap-1 items-start rounded-lg bg-[#FFF8F7] w-full">
        <span className="text-[#93000B] font-inter text-sm font-semibold flex items-center gap-1">
          📈 {xpNeeded} XP to {nextLevel}
        </span>
        <span className="text-[#93000B] font-inter text-[10px] opacity-80 leading-tight">
          Unlock exclusive health screening rewards and premium donor badge.
        </span>
      </div>
    </div>
  );
};
