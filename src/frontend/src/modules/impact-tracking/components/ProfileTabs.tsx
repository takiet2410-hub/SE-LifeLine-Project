import React from 'react';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = ['Profile Info', 'Donation Timeline', 'Achievements', 'Donor Level'];

  return (
    <div className="flex items-start gap-10 border-b border-[#DEE2E6] w-full mt-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`cursor-pointer text-nowrap flex pb-4 px-2 flex-col justify-center items-center relative transition-colors`}
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
