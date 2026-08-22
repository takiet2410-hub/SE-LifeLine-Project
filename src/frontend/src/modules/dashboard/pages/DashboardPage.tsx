import React from 'react';
import { WelcomeHero } from '../components/WelcomeHero';
import { QuickActions } from '../components/QuickActions';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { LocationPromptBanner } from '../components/LocationPromptBanner';
import { UpcomingAppointment } from '../components/UpcomingAppointment';
import { CampaignList } from '../components/CampaignList';
import { DonationProcessSection } from '../components/DonationProcessSection';
import { NewsTipsGrid } from '../components/NewsTipsGrid';

export const DashboardPage: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-8">
      {/* 1. Header Area */}
      <WelcomeHero />

      {/* 2. Quick Actions */}
      <QuickActions />

      {/* 3. Main Content Grid (65% - 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column (Main Focus) */}
        <div className="lg:col-span-8 flex flex-col">
          <LocationPromptBanner />
          <EmergencyBanner />
          <UpcomingAppointment />
          <div className="mt-auto pt-6 space-y-6">
            <DonationProcessSection />
            <NewsTipsGrid />
          </div>
        </div>

        {/* Right Column (Sidebar-ish) */}
        <div className="lg:col-span-4 h-full">
          <CampaignList />
        </div>

      </div>
    </div>
  );
};
