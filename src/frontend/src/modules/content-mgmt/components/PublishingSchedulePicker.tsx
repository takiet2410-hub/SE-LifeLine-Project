import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface PublishingSchedulePickerProps {
  value?: string | null;
  onChange: (scheduledAt: string | null) => void;
}

export const PublishingSchedulePicker: React.FC<PublishingSchedulePickerProps> = ({ value, onChange }) => {
  const isScheduled = !!value;

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val ? new Date(val).toISOString() : null);
  };

  const formatLocalISO = (isoStr?: string | null) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Lịch xuất bản</span>
        </div>
        {isScheduled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
          >
            Hủy lịch hẹn (Xuất bản ngay)
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Để trống để xuất bản ngay khi lưu, hoặc chọn ngày và giờ xuất bản trong tương lai.
      </p>

      <div className="flex items-center space-x-3 pt-1">
        <div className="relative flex-1 max-w-xs">
          <input
            type="datetime-local"
            value={formatLocalISO(value)}
            min={new Date().toISOString().slice(0, 16)}
            onChange={handleDateTimeChange}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-red-500 focus:border-red-500"
          />
          <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        {value && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Đã lên lịch vào {new Date(value).toLocaleString('vi-VN')}
          </span>
        )}
      </div>
    </div>
  );
};
