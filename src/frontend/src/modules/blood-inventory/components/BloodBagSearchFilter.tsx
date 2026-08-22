import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { BloodType, BagStatus } from '../types/inventory.types';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBloodType: string;
  onBloodTypeChange: (type: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onClearFilters: () => void;
}

const BLOOD_TYPES: (BloodType | 'All')[] = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES: (BagStatus | 'All')[] = ['All', 'Available', 'Reserved', 'Used', 'Expired', 'Discarded'];

const STATUS_LABELS: Record<string, string> = {
  All: 'Tất cả trạng thái',
  Available: 'Khả dụng',
  Reserved: 'Đã đặt trước',
  Used: 'Đã sử dụng',
  Expired: 'Đã hết hạn',
  Discarded: 'Đã hủy',
};

export const BloodBagSearchFilter: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  selectedBloodType,
  onBloodTypeChange,
  selectedStatus,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo mã túi máu (VD: BB-2026)..."
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <select
            value={selectedBloodType}
            onChange={(e) => onBloodTypeChange(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            <option value="All">Tất cả nhóm máu</option>
            {BLOOD_TYPES.filter((t) => t !== 'All').map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            <option value="All">Tất cả trạng thái</option>
            {STATUSES.filter((s) => s !== 'All').map((st) => (
              <option key={st} value={st}>
                {STATUS_LABELS[st] || st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            title="Từ ngày lấy máu"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            title="Đến ngày lấy máu"
          />
        </div>

        {(searchQuery || selectedBloodType !== 'All' || selectedStatus !== 'All' || startDate || endDate) && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-9 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
};
