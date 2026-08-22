import React from 'react';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gamificationEnabled?: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab, gamificationEnabled = true }) => {
  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân' },
    { id: 'timeline', label: 'Lịch sử hiến máu' },
    ...(gamificationEnabled
      ? [
          { id: 'achievements', label: 'Huy hiệu & Thành tích' },
          { id: 'donor-level', label: 'Cấp bậc người hiến' },
        ]
      : []),
  ];

  return (
    <div className="flex items-start gap-5 sm:gap-10 border-b border-[#DEE2E6] w-full mt-2 sm:mt-4 overflow-x-auto overscroll-x-contain">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`cursor-pointer shrink-0 text-nowrap flex pb-4 px-1 sm:px-2 flex-col justify-center items-center relative transition-colors`}
        >
          <span
            className={`font-inter text-base leading-6 ${
              activeTab === tab.id ? 'text-[#93000B] font-semibold' : 'text-[#5B403D]'
            }`}
          >
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <div className="absolute -bottom-px bg-[#93000B] w-full h-0.5"></div>
          )}
        </button>
      ))}
    </div>
  );
};
