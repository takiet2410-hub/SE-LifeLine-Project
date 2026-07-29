import React from 'react';
import type { AppointmentStatus } from '../types';

interface AppointmentTabsProps {
  activeTab: AppointmentStatus;
  onChangeTab: (tab: AppointmentStatus) => void;
}

export const AppointmentTabs: React.FC<AppointmentTabsProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: AppointmentStatus; label: string }[] = [
    { id: 'all', label: 'All Appointments' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'no-show', label: 'No Show' },
  ];

  return (
    <div className="flex items-center gap-6 border-b border-[#dee2e6] mb-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`relative pb-3 text-[14px] font-medium transition-colors ${
              isActive ? 'text-[#93000b]' : 'text-[#6c757d] hover:text-[#271816]'
            }`}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#93000b] rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
