import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
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
import { apiService } from '../../../services/apiClient';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';

const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#16A34A', '#2563EB', '#4F46E5', '#9333EA'];

export const InventoryStatsPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'Units' | 'Volume' | 'NearExpiry'>('Units');

  useEffect(() => {
    apiService.getInventoryStatistics().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <SkeletonLoader type="card" />;

  const chartData = (stats?.unitsByBloodType || []).map((item: any) => ({
    name: item.type,
    units: item.count,
    volume: item.count * 350,
    nearExpiry: item.type === 'O+' || item.type === 'A-' ? 1 : 0,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bc/inventory')}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Báo Cáo & Thống Kê Kho Máu</h2>
            <p className="text-xs text-slate-500">Phân tích biểu đồ tồn kho và cảnh báo dự trữ an toàn</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
          <button
            onClick={() => setChartMode('Units')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              chartMode === 'Units' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Số túi máu
          </button>
          <button
            onClick={() => setChartMode('Volume')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              chartMode === 'Volume' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thể tích (ml)
          </button>
        </div>
      </div>

      {/* Warnings Panel */}
      {stats?.lowStockTypes?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">Cảnh báo thiếu hụt dự trữ an toàn!</p>
            <p className="text-xs text-amber-700">
              Các nhóm máu sau có số lượng tồn kho dưới ngưỡng an toàn (dưới 3 túi):{' '}
              <strong className="text-amber-900 font-black">{stats.lowStockTypes.join(', ')}</strong>. Cần tổ chức chiến dịch tiếp nhận bổ sung.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Tổng túi máu</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalUnits}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Khả dụng sẵn có</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.availableUnits}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Gần hết hạn (≤ 7d)</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.nearExpiryUnits}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Nhóm máu thiếu</span>
          <p className="text-2xl font-black text-red-600 mt-1">{stats?.lowStockTypes?.length || 0}</p>
        </div>
      </div>

      {/* Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Units by Blood Type */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-red-600" />
            <span>Biểu đồ số lượng tồn kho theo Nhóm Máu ({chartMode === 'Units' ? 'Đơn vị túi' : 'Thể tích ml'})</span>
          </h3>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                />
                <Bar
                  dataKey={chartMode === 'Units' ? 'units' : 'volume'}
                  fill="#dc2626"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Distribution */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-red-600" />
            <span>Tỷ lệ phân bố nhóm máu</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="units"
                >
                  {chartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
