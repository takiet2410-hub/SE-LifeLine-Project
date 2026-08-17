import React from 'react';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gamificationEnabled?: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab, gamificationEnabled = true }) => {
  const tabs = gamificationEnabled
    ? ['Profile Info', 'Donation Timeline', 'Achievements', 'Donor Level']
    : ['Profile Info', 'Donation Timeline'];

  return (
    <div className="flex items-start gap-5 sm:gap-10 border-b border-[#DEE2E6] w-full mt-2 sm:mt-4 overflow-x-auto overscroll-x-contain">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`cursor-pointer shrink-0 text-nowrap flex pb-4 px-1 sm:px-2 flex-col justify-center items-center relative transition-colors`}
        >
          <span
            className={`font-inter text-base leading-6 ${
              activeTab === tab ? 'text-[#93000B] font-semibold' : 'text-[#5B403D]'
            }`}
          >
            {tab}
          </span>
          {activeTab === tab && (
            <div className="absolute -bottom-px bg-[#93000B] w-full h-0.5"></div>
          )}
        </button>
      ))}
    </div>
  );
};
