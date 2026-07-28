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
  const isCompleted = appointment.status === 'completed';
  const isNoShow = appointment.status === 'no-show';

  return (
    <div 
      onClick={() => onClick(appointment.id)}
      className={`cursor-pointer border rounded-xl p-4 transition-all shadow-sm flex flex-col gap-3 ${
        isSelected 
          ? 'bg-[#fff8f7] border-[#93000b] ring-1 ring-[#93000b]' 
          : 'bg-white border-[#f1f3f5] hover:border-[#dee2e6] hover:shadow-md'
      } ${isCancelled || isNoShow ? 'opacity-75' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className={`text-[15px] font-bold line-clamp-1 flex-1 ${isSelected ? 'text-[#93000b]' : 'text-[#271816]'}`}>
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
          {isCancelled && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              Đã hủy
            </span>
          )}
          {isNoShow && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
              Vắng mặt / Quá hạn
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[#271816]">
            <CalendarDays className="w-3.5 h-3.5 text-[#93000b]" />
            <span className="font-semibold text-[13px]">{appointment.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#6c757d]">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[12px]">{appointment.time}</span>
          </div>
        </div>
        
        <div className="flex items-start gap-1.5 text-[#6c757d]">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p className="text-[12px] line-clamp-1">
            {appointment.location.address || 'Blood center location'}
          </p>
        </div>
      </div>
    </div>
  );
};
