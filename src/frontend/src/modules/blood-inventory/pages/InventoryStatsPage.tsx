import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, PieChart as PieChartIcon, BarChart2, TrendingDown, CheckCircle2, ShieldAlert } from 'lucide-react';
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
import { inventoryApi } from '../services/inventoryApi';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import type { InventoryStatisticsData } from '../types/inventory.types';

const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#16A34A', '#2563EB', '#4F46E5', '#9333EA'];

export const InventoryStatsPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<InventoryStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'Units' | 'Volume'>('Units');

  useEffect(() => {
    inventoryApi.getStatistics().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const chartData = useMemo(() => {
    if (!stats || !stats.byBloodType) return [];
    return stats.byBloodType.map((item) => ({
      name: item.bloodType,
      units: item.totalUnits,
      volume: item.volumeMl,
      nearExpiry: item.nearExpiry,
      status: item.status,
    }));
  }, [stats]);

  const lowStockTypes = useMemo(() => {
    if (!stats || !stats.byBloodType) return [];
    return stats.byBloodType.filter(item => item.status === 'Critical' || item.status === 'Low Stock');
  }, [stats]);

  if (loading) return <SkeletonLoader type="card" />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/bc/inventory')}
          className="h-10 px-3.5 rounded-xl bg-white border border-[#f1f3f5] hover:bg-slate-50 text-[#6c757d] hover:text-[#271816] transition-all cursor-pointer flex items-center gap-2 text-sm font-semibold shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Kho Máu</span>
        </button>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/60 h-10">
          <button
            onClick={() => setChartMode('Units')}
            className={`h-8 px-3.5 text-[12px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
              chartMode === 'Units' 
                ? 'bg-white text-[#93000b] shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Số túi máu
          </button>
          <button
            onClick={() => setChartMode('Volume')}
            className={`h-8 px-3.5 text-[12px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
              chartMode === 'Volume' 
                ? 'bg-white text-[#93000b] shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Thể tích (ml)
          </button>
        </div>
      </div>

      {/* Warnings Panel */}
      {lowStockTypes.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200/60 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-red-900">Cảnh báo thiếu hụt dự trữ an toàn!</h3>
            <p className="text-[13px] font-medium text-red-800/80 mt-1 leading-relaxed">
              Các nhóm máu sau đang ở mức cảnh báo:
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {lowStockTypes.map((type) => (
                <span 
                  key={type.bloodType} 
                  className={`px-3 py-1 text-[12px] font-bold rounded-lg border ${
                    type.status === 'Critical' 
                      ? 'bg-red-600 text-white border-red-700 shadow-xs' 
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {type.bloodType} ({type.status === 'Critical' ? 'Báo động đỏ' : 'Thiếu hụt'}) - Chỉ còn {type.totalUnits} túi
                </span>
              ))}
            </div>
            <p className="text-[12px] font-bold text-red-900 mt-3 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" /> Đề xuất: Cần tổ chức ngay chiến dịch tiếp nhận bổ sung nhóm máu này.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 hover:border-slate-300 transition-colors rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart2 className="w-16 h-16 text-slate-900" />
          </div>
          <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Tổng túi máu</span>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-black text-slate-900">{stats?.summaryCards?.totalUnits || 0}</p>
            <span className="text-sm font-semibold text-slate-400">túi</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 hover:border-emerald-200 transition-colors rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-emerald-600" />
          </div>
          <span className="text-[13px] font-bold text-emerald-700 uppercase tracking-wider">Khả dụng sẵn có</span>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-black text-emerald-600">{stats?.summaryCards?.availableUnits || 0}</p>
            <span className="text-sm font-semibold text-emerald-400">túi</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 hover:border-amber-200 transition-colors rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-amber-600" />
          </div>
          <span className="text-[13px] font-bold text-amber-700 uppercase tracking-wider">Gần hết hạn (≤ 7d)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-black text-amber-600">{stats?.summaryCards?.nearExpiryUnits || 0}</p>
            <span className="text-sm font-semibold text-amber-400">túi</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 hover:border-red-200 transition-colors rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert className="w-16 h-16 text-red-600" />
          </div>
          <span className="text-[13px] font-bold text-red-700 uppercase tracking-wider">Nhóm máu thiếu hụt</span>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-black text-red-600">{stats?.summaryCards?.lowStockTypesCount || 0}</p>
            <span className="text-sm font-semibold text-red-400">nhóm</span>
          </div>
        </div>
      </div>

      {/* Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Units by Blood Type */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-[15px] font-extrabold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-slate-700" />
              </div>
              <span>Biểu đồ số lượng tồn kho theo Nhóm Máu</span>
            </h3>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[11px] uppercase tracking-wider rounded-full">
              {chartMode === 'Units' ? 'Đơn vị túi' : 'Thể tích ml'}
            </span>
          </div>

          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 800, fill: '#475569' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#fff', fontWeight: 600 }}
                />
                <Bar
                  dataKey={chartMode === 'Units' ? 'units' : 'volume'}
                  fill="#93000b"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'Critical' ? '#DC2626' : (entry.status === 'Low Stock' ? '#F59E0B' : '#93000b')} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Distribution */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-[15px] font-extrabold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4 text-slate-700" />
              </div>
              <span>Tỷ lệ phân bố kho</span>
            </h3>
          </div>

          <div className="flex-1 min-h-[300px] w-full flex flex-col justify-center relative">
            {(!stats || stats.summaryCards.availableUnits === 0) && (
               <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium text-sm">Chưa có dữ liệu kho khả dụng</div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter((d) => d.units > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="units"
                  stroke="none"
                  animationDuration={1500}
                >
                  {chartData.filter((d) => d.units > 0).map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700, color: '#0f172a' }}
                />
                <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-[16px] font-extrabold text-slate-900">Bảng Chi Tiết Dự Trữ Theo Nhóm Máu</h3>
          <p className="text-[13px] font-medium text-slate-500 mt-0.5">Dữ liệu chi tiết thể tích và số lượng túi máu còn hạn sử dụng</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">Nhóm Máu</th>
                <th className="px-6 py-4 text-center">Trạng Thái Kho</th>
                <th className="px-6 py-4 text-right">Tổng Túi Khả Dụng</th>
                <th className="px-6 py-4 text-right">Tổng Thể Tích (ml)</th>
                <th className="px-6 py-4 text-right">Gần Hết Hạn (≤ 7d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-[#93000b] text-[15px]">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                      {row.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                      row.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                      row.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {row.status === 'Critical' ? 'Báo động đỏ' : row.status === 'Low Stock' ? 'Thiếu hụt' : 'An toàn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-900 text-[15px]">{row.units}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-600">{row.volume.toLocaleString()} ml</td>
                  <td className="px-6 py-4 text-right">
                    {row.nearExpiry > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 text-[12px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {row.nearExpiry} túi
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

