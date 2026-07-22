import React, { useState } from 'react';
import { ProfileHeaderCard } from '../components/ProfileHeaderCard';
import { ProfileTabs } from '../components/ProfileTabs';
import { DonationTimeline } from '../components/DonationTimeline';
import { XPActivityLog } from '../components/XPActivityLog';
import { ProfileInfoTab } from '../components/ProfileInfoTab';
import { CurrentProgress } from '../components/CurrentProgress';
import { AchievementsWidget } from '../components/AchievementsWidget';
import { CallToAction } from '../components/CallToAction';

export const MyProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Profile Info');

  return (
    <div className="flex flex-col items-start gap-8 w-full p-8 min-h-[calc(100vh-72px)] bg-[#fff8f7]">
      {/* Header Block */}
      <ProfileHeaderCard />
      
      {/* Tabs */}
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 w-full relative items-start">
        {/* Left Column - Main Content */}
        <div className="flex flex-col gap-8 w-full">
          {activeTab === 'Profile Info' && (
            <ProfileInfoTab />
          )}
          
          {(activeTab === 'Profile Info' || activeTab === 'Donation Timeline') && (
            <DonationTimeline />
          )}

          {(activeTab === 'Profile Info' || activeTab === 'Achievements') && (
            <XPActivityLog />
          )}
          
          {activeTab === 'Donor Level' && (
            <div className="p-6 bg-white rounded-xl border border-[#f1f3f5] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-semibold text-[#271816]">Donor Level Details Coming Soon</h2>
            </div>
          )}
        </div>

        {/* Right Column - Widgets */}
        <div className="flex flex-col gap-6 w-full lg:sticky lg:top-8">
          <CurrentProgress />
          <AchievementsWidget />
          <CallToAction />
        </div>
      </div>
    </div>
  );
};
