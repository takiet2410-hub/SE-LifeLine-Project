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
  onClearFilters: () => void;
}

const BLOOD_TYPES: (BloodType | 'All')[] = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES: (BagStatus | 'All')[] = ['All', 'Available', 'Reserved', 'Used', 'Expired', 'Discarded'];

export const BloodBagSearchFilter: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  selectedBloodType,
  onBloodTypeChange,
  selectedStatus,
  onStatusChange,
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
          placeholder="Search by Bag ID (e.g. BB-2026)..."
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
            <option value="All">All Blood Types</option>
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
            <option value="All">All Statuses</option>
            {STATUSES.filter((s) => s !== 'All').map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {(searchQuery || selectedBloodType !== 'All' || selectedStatus !== 'All') && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-9 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
