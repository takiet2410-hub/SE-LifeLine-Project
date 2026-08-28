import React from 'react';
import type { ProfileData } from './ProfileHeaderCard';

interface CurrentProgressProps {
  profileData?: ProfileData | null;
}

export const CurrentProgress: React.FC<CurrentProgressProps> = ({ profileData }) => {
  // Lấy dữ liệu thật hoặc default 0
  const xp = profileData?.donationImpact?.xp || 0;
  
  // Logic level
  let maxXP = 500;
  let levelName = 'HẠNG ĐỒNG';
  let nextLevel = 'Hạng Bạc';
  let isMaxLevel = false;

  if (xp >= 10000) {
    maxXP = xp; // At max level, we just cap it or set maxXP to current XP
    levelName = 'HẠNG HUYỀN THOẠI';
    nextLevel = '';
    isMaxLevel = true;
  } else if (xp >= 5000) {
    maxXP = 10000;
    levelName = 'HẠNG KIM CƯƠNG';
    nextLevel = 'Hạng Huyền Thoại';
  } else if (xp >= 2000) {
    maxXP = 5000;
    levelName = 'HẠNG BẠCH KIM';
    nextLevel = 'Hạng Kim Cương';
  } else if (xp >= 1000) {
    maxXP = 2000;
    levelName = 'HẠNG VÀNG';
    nextLevel = 'Hạng Bạch Kim';
  } else if (xp >= 500) {
    maxXP = 1000;
    levelName = 'HẠNG BẠC';
    nextLevel = 'Hạng Vàng';
  }

  const xpNeeded = isMaxLevel ? 0 : maxXP - xp;
  const progressPercent = isMaxLevel ? 100 : Math.min((xp / maxXP) * 100, 100);

  return (
    <div className="flex p-6 flex-col items-start gap-4 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
      <h3 className="text-[#271816] font-inter text-base font-bold leading-6">Tiến Độ Cấp Bậc</h3>
      
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center w-full">
          <span className="text-[#6C757D] font-inter text-[10px] font-bold tracking-widest uppercase">CẤP ĐỘ: {levelName}</span>
          <span className="text-[#271816] font-inter text-[10px] font-bold tracking-widest uppercase">{isMaxLevel ? `${xp} XP` : `${xp} / ${maxXP} XP`}</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
          <div className="h-full bg-[#93000B] rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
      
      <div className="flex p-4 flex-col gap-1 items-start rounded-lg bg-[#FFF8F7] w-full">
        {isMaxLevel ? (
          <>
            <span className="text-[#93000B] font-inter text-sm font-semibold flex items-center gap-1">
              🏆 Bạn đã đạt cấp độ cao nhất!
            </span>
            <span className="text-[#93000B] font-inter text-[10px] opacity-80 leading-tight">
              Cảm ơn những đóng góp tuyệt vời của bạn cho cộng đồng và sứ mệnh hiến máu.
            </span>
          </>
        ) : (
          <>
            <span className="text-[#93000B] font-inter text-sm font-semibold flex items-center gap-1">
              📈 Cần thêm {xpNeeded} XP để đạt {nextLevel}
            </span>
            <span className="text-[#93000B] font-inter text-[10px] opacity-80 leading-tight">
              Mở khóa các quyền lợi tri ân sức khỏe và huy hiệu người hiến máu tiêu biểu.
            </span>
          </>
        )}
      </div>
    </div>
  );
};
