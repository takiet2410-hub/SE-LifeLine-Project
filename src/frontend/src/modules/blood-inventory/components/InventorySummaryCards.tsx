import React from 'react';
import { Database, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { InventorySummary } from '../types/inventory.types';

interface Props {
  summary?: InventorySummary;
  isLoading?: boolean;
}

export const InventorySummaryCards: React.FC<Props> = ({ summary, isLoading = false }) => {
  const cards = [
    {
      title: 'Total Blood Bags',
      value: summary ? summary.totalBags : 0,
      subText: summary ? `${summary.totalVolumeMl.toLocaleString()} ml total volume` : '0 ml',
      icon: Database,
      bgColor: 'bg-red-50 text-red-600',
    },
    {
      title: 'Available Stock',
      value: summary ? summary.availableBags : 0,
      subText: 'Ready for allocation',
      icon: Activity,
      bgColor: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Near Expiry (≤7 days)',
      value: summary ? summary.nearExpiryCount : 0,
      subText: summary && summary.nearExpiryCount > 0 ? 'Requires FEFO dispatch' : 'No urgent expiry',
      icon: AlertTriangle,
      bgColor: summary && summary.nearExpiryCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500',
    },
    {
      title: 'Low Stock Types',
      value: summary ? summary.lowStockTypesCount : 0,
      subText: summary && summary.lowStockTypesCount > 0 ? 'Below minimum threshold' : 'Stock level normal',
      icon: ShieldAlert,
      bgColor: summary && summary.lowStockTypesCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-slate-500">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
              <p className="text-xs text-slate-400 mt-1">{card.subText}</p>
            </div>
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
