import React from 'react';
import type { TargetAudience } from '../types/article.types';

interface TargetAudienceSelectorProps {
  selected: TargetAudience[];
  onChange: (audience: TargetAudience[]) => void;
}

const AUDIENCE_OPTIONS: { id: TargetAudience; label: string; desc: string }[] = [
  { id: 'Donors', label: 'Người hiến máu', desc: 'Người hiến máu & tình nguyện viên' },
  { id: 'Staff', label: 'Nhân viên trung tâm', desc: 'Nhân viên y tế & quản trị nội bộ' },
  { id: 'Hospitals', label: 'Bệnh viện & Phòng khám', desc: 'Các cơ sở y tế đối tác' }
];

export const TargetAudienceSelector: React.FC<TargetAudienceSelectorProps> = ({ selected, onChange }) => {
  const handleToggle = (id: TargetAudience) => {
    if (selected.includes(id)) {
      if (selected.length === 1) return; // Must keep at least one
      onChange(selected.filter(a => a !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Đối tượng mục tiêu (Chọn tất cả đối tượng phù hợp)
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AUDIENCE_OPTIONS.map((opt) => {
          const isChecked = selected.includes(opt.id);
          return (
            <div
              key={opt.id}
              onClick={() => handleToggle(opt.id)}
              className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                isChecked
                  ? 'border-red-500 bg-red-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}} // Handled by div click
                className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                <span className="block text-xs text-gray-500">{opt.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
