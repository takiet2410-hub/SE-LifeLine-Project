import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { InventoryStatisticsData } from '../types/inventory.types';

interface Props {
  data?: InventoryStatisticsData;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'];

export const InventoryAnalyticsChart: React.FC<Props> = ({ data }) => {
  const [chartMode, setChartMode] = useState<'units' | 'volume' | 'nearExpiry'>('units');

  if (!data) return null;

  const barData = data.byBloodType.map((b) => ({
    type: b.bloodType,
    val:
      chartMode === 'units'
        ? b.totalUnits
        : chartMode === 'volume'
        ? b.volumeMl
        : b.nearExpiry,
  }));

  const pieData = data.byBloodType
    .filter((b) => b.totalUnits > 0)
    .map((b) => ({
      name: b.bloodType,
      value: b.totalUnits,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Bar Chart Section */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Inventory Analytics</h3>
            <p className="text-xs text-slate-500">Distribution by blood group</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setChartMode('units')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                chartMode === 'units' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Units
            </button>
            <button
              onClick={() => setChartMode('volume')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                chartMode === 'volume' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Volume (ml)
            </button>
            <button
              onClick={() => setChartMode('nearExpiry')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                chartMode === 'nearExpiry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Near Expiry
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="type" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="val" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-base mb-1">Type Ratio</h3>
          <p className="text-xs text-slate-500">Blood group percentage</p>
        </div>

        <div className="h-56 w-full relative my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
