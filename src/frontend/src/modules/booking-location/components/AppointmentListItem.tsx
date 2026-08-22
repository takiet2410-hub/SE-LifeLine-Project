import React from 'react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import type { Appointment } from '../types';

interface AppointmentListItemProps {
  appointment: Appointment;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export const AppointmentListItem: React.FC<AppointmentListItemProps> = ({ 
  appointment, 
  isSelected,
  onClick
}) => {
  const isPending = appointment.status === 'pending';
  const isUpcoming = appointment.status === 'upcoming';
  const isCancelled = appointment.status === 'cancelled';
  const isRejected = appointment.status === 'rejected';
  const isCompleted = appointment.status === 'completed';
  const isNoShow = appointment.status === 'no-show';

  return (
    <div 
      onClick={() => onClick(appointment.id)}
      className={`cursor-pointer border rounded-xl p-3 sm:p-3.5 lg:p-4 transition-all shadow-2xs flex flex-col gap-2.5 ${
        isSelected 
          ? 'bg-[#fff8f7] border-[#93000b] ring-1.5 ring-[#93000b]/40 shadow-xs' 
          : 'bg-white border-[#f1f3f5] hover:border-[#dee2e6] hover:shadow-xs'
      } ${isCancelled || isRejected || isNoShow ? 'opacity-80 bg-gray-50/50' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className={`text-[13.5px] sm:text-[14.5px] font-bold line-clamp-1 flex-1 leading-snug ${isSelected ? 'text-[#93000b]' : 'text-[#271816]'}`}>
          {appointment.location.name}
        </h3>
        
        {/* Status Badge */}
        <div className="shrink-0">
          {isPending && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
              Chờ duyệt
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Đã xác nhận
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
              Đã hoàn thành
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              Đã từ chối
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              Đã hủy
            </span>
          )}
          {isNoShow && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
              Vắng mặt
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[#271816]">
            <CalendarDays className="w-3.5 h-3.5 text-[#93000b] shrink-0" />
            <span className="font-semibold text-[12.5px] sm:text-[13px]">{appointment.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#6c757d]">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11.5px] sm:text-[12px]">{appointment.time}</span>
          </div>
        </div>
        
        <div className="flex items-start gap-1.5 text-[#6c757d]">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p className="text-[11.5px] sm:text-[12px] line-clamp-1">
            {appointment.location.address || 'Điểm tiếp nhận hiến máu'}
          </p>
        </div>
      </div>
    </div>
  );
};
