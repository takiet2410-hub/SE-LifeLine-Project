import React from 'react';

export const XPActivityLog: React.FC = () => {
  return (
    <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
      <div className="flex p-6 flex-col border-b border-[#F1F3F5] w-full">
        <h2 className="text-[#271816] font-inter text-lg font-semibold leading-[25.2px]">XP Activity Log</h2>
      </div>
      
      <div className="flex flex-col items-start w-full">
        {/* Header row */}
        <div className="flex w-full border-b border-[#F1F3F5] bg-[#F8F9FA]">
          <div className="flex py-4 px-6 w-[40%]"><span className="text-[#6C757D] text-xs font-medium tracking-wide">ACTIVITY</span></div>
          <div className="flex py-4 px-6 w-[20%]"><span className="text-[#6C757D] text-xs font-medium tracking-wide">DATE</span></div>
          <div className="flex py-4 px-6 w-[20%]"><span className="text-[#6C757D] text-xs font-medium tracking-wide">POINTS</span></div>
          <div className="flex py-4 px-6 w-[20%] justify-end"><span className="text-[#6C757D] text-xs font-medium tracking-wide">IMPACT</span></div>
        </div>
        
        {/* Row 1 */}
        <div className="flex w-full items-center border-b border-[#F1F3F5] py-4">
          <div className="flex flex-col px-6 w-[40%]">
            <span className="text-[#271816] text-base font-medium">Whole Blood Donation</span>
            <span className="text-[#A3A3A3] text-xs font-medium">Regular Cycle</span>
          </div>
          <div className="flex px-6 w-[20%] text-[#271816] text-sm">Mar 15, 2024</div>
          <div className="flex px-6 w-[20%] text-[#16A34A] text-base font-bold">+250 XP</div>
          <div className="flex px-6 w-[20%] justify-end gap-1 text-[#271816] font-semibold text-base">♥️ x3</div>
        </div>

        {/* Row 2 */}
        <div className="flex w-full items-center border-b border-[#F1F3F5] py-4">
          <div className="flex flex-col px-6 w-[40%]">
            <span className="text-[#271816] text-base font-medium">Shared Campaign</span>
            <span className="text-[#A3A3A3] text-xs font-medium">World Blood Donor Day</span>
          </div>
          <div className="flex px-6 w-[20%] text-[#271816] text-sm">Feb 20, 2024</div>
          <div className="flex px-6 w-[20%] text-[#16A34A] text-base font-bold">+50 XP</div>
          <div className="flex px-6 w-[20%] justify-end gap-1 text-[#271816] font-semibold text-base">🔗 x1</div>
        </div>

        {/* Row 3 */}
        <div className="flex w-full items-center py-4">
          <div className="flex flex-col px-6 w-[40%]">
            <span className="text-[#271816] text-base font-medium">Referral Signup</span>
            <span className="text-[#A3A3A3] text-xs font-medium">Invite: Tran Ha My</span>
          </div>
          <div className="flex px-6 w-[20%] text-[#271816] text-sm">Jan 12, 2024</div>
          <div className="flex px-6 w-[20%] text-[#16A34A] text-base font-bold">+100 XP</div>
          <div className="flex px-6 w-[20%] justify-end gap-1 text-[#271816] font-semibold text-base">🤝 x1</div>
        </div>
      </div>
    </div>
  );
};
