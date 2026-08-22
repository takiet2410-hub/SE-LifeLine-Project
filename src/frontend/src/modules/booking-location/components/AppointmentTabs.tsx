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
    <div className="border-b border-[#dee2e6] mb-4 sm:mb-5 shrink-0 w-full">
      <div className="flex items-center gap-4 sm:gap-6 md:gap-7 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full -mb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative shrink-0 whitespace-nowrap pb-2.5 sm:pb-3 text-[13px] sm:text-[14px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-[#93000b] font-bold' : 'text-[#6c757d] hover:text-[#271816]'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#93000b] rounded-t-full shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
      
      {rightContent && (
        <div className="pt-2 pb-1 shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
};
