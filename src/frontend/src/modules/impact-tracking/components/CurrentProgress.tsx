import React from 'react';

export const CurrentProgress: React.FC = () => {
  return (
    <div className="flex p-6 flex-col items-start gap-4 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
      <h3 className="text-[#271816] font-inter text-base font-bold leading-6">Current Progress</h3>
      
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center w-full">
          <span className="text-[#6C757D] font-inter text-[10px] font-bold tracking-widest uppercase">LEVEL: GOLD DONOR</span>
          <span className="text-[#271816] font-inter text-[10px] font-bold tracking-widest uppercase">750 / 1000 XP</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
          <div className="h-full bg-[#93000B] w-[75%] rounded-full"></div>
        </div>
      </div>
      
      <div className="flex p-4 flex-col gap-1 items-start rounded-lg bg-[#FFF8F7] w-full">
        <span className="text-[#93000B] font-inter text-sm font-semibold flex items-center gap-1">
          📈 250 XP to Platinum Rank
        </span>
        <span className="text-[#93000B] font-inter text-[10px] opacity-80 leading-tight">
          Unlock exclusive health screening rewards and premium donor badge.
        </span>
      </div>
    </div>
  );
};
