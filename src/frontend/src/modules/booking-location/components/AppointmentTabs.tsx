import React from 'react';
import type { AppointmentStatus } from '../types';

interface AppointmentTabsProps {
  activeTab: AppointmentStatus;
  onChangeTab: (tab: AppointmentStatus) => void;
  rightContent?: React.ReactNode;
}

export const AppointmentTabs: React.FC<AppointmentTabsProps> = ({ activeTab, onChangeTab, rightContent }) => {
  const tabs: { id: AppointmentStatus; label: string }[] = [
    { id: 'all', label: 'Tất cả lịch hẹn' },
    { id: 'pending', label: 'Chờ Duyệt' },
    { id: 'upcoming', label: 'Sắp diễn ra' },
    { id: 'completed', label: 'Đã hoàn thành' },
    { id: 'rejected', label: 'Đã từ chối' },
    { id: 'cancelled', label: 'Đã hủy' },
    { id: 'no-show', label: 'Vắng mặt' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#dee2e6] mb-4 sm:mb-6 gap-3 sm:gap-4">
      <div className="flex items-center gap-5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full sm:w-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative shrink-0 whitespace-nowrap pb-3 text-[14px] font-medium transition-colors ${
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
      
      {rightContent && (
        <div className="pb-3 sm:pb-2 shrink-0 self-start sm:self-auto">
          {rightContent}
        </div>
      )}
    </div>
  );
};
