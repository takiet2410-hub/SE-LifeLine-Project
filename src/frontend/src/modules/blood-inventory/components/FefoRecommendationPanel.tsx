import React from 'react';
import { ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { BloodBagItem } from '../types/inventory.types';

interface Props {
  nearExpiryBags: BloodBagItem[];
  selectedBagIds: string[];
  onSelectAllRecommended: () => void;
  onSkip: () => void;
}

export const FefoRecommendationPanel: React.FC<Props> = ({
  nearExpiryBags,
  selectedBagIds,
  onSelectAllRecommended,
  onSkip,
}) => {
  if (nearExpiryBags.length === 0) return null;

  const allSelected = nearExpiryBags.every((b) => selectedBagIds.includes(b._id));

  return (
    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 mb-6 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
          <ClipboardList className="w-5 h-5 text-amber-600" />
          <span>FEFO Recommendation (First Expired, First Out)</span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-amber-700 hover:text-amber-900 underline font-medium"
        >
          Skip FEFO Panel
        </button>
      </div>

      <p className="text-xs text-amber-800 mt-1">
        <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
        <strong>{nearExpiryBags.length}</strong> blood bag(s) expire within 7 days. Consider dispatching these first to prevent waste.
      </p>

      <div className="mt-3 bg-white/90 rounded-lg border border-amber-200/60 p-3 divide-y divide-amber-100 max-h-48 overflow-y-auto">
        {nearExpiryBags.map((bag) => {
          const exp = new Date(bag.expiryDate);
          const daysLeft = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          const isSelected = selectedBagIds.includes(bag._id);

          return (
            <div key={bag._id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-800">{bag.bagCode}</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 font-bold">{bag.bloodType}</span>
                <span className="text-slate-500">{bag.volumeMl} ml</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-700 font-medium">Expires in {daysLeft}d ({exp.toLocaleDateString('en-GB')})</span>
                {isSelected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Recommended</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onSelectAllRecommended}
          disabled={allSelected}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
        >
          {allSelected ? '✓ All Recommended Selected' : 'Select All Recommended'}
        </button>
      </div>
    </div>
  );
};
