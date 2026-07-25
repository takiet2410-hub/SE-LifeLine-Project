import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpRight, BarChart2, Search, Eye, AlertCircle, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../services/apiClient';
import type { BloodBagData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DataTable } from '../../../components/common/DataTable';
import type { Column } from '../../../components/common/DataTable';
import { format, differenceInDays } from 'date-fns';

export const InventoryListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bags, setBags] = useState<BloodBagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('All');
  const statusFilter = 'All';

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await apiService.getInventory(search, bloodTypeFilter, statusFilter);
      setBags(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, bloodTypeFilter, statusFilter]);

  const totalBags = bags.length;
  const availableBags = bags.filter((b) => b.status === 'Available').length;
  const nearExpiryBags = bags.filter((b) => {
    const diffDays = differenceInDays(new Date(b.expiryDate), new Date());
    return diffDays >= 0 && diffDays <= 7 && b.status === 'Available';
  }).length;

  const columns: Column<BloodBagData>[] = [
    {
      header: 'Mã túi máu',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900 font-mono">{row.bagCode}</p>
          <p className="text-[11px] text-slate-400">ID: {row._id}</p>
        </div>
      ),
    },
    {
      header: 'Nhóm máu',
      accessor: (row) => (
        <span className="px-2.5 py-1 text-xs font-black bg-red-600 text-white rounded-md shadow-2xs">
          {row.bloodType}
        </span>
      ),
    },
    {
      header: 'Thể tích',
      accessor: (row) => <span className="font-semibold text-slate-800">{row.volumeMl} ml</span>,
    },
    {
      header: 'Hạn sử dụng (FEFO)',
      accessor: (row) => {
        const diffDays = differenceInDays(new Date(row.expiryDate), new Date());
        const isNearExpiry = diffDays >= 0 && diffDays <= 7 && row.status === 'Available';
        const isExpired = diffDays < 0 || row.status === 'Expired';

        return (
          <div className="space-y-0.5">
            <p className={`font-medium text-xs ${isExpired ? 'text-red-700 font-bold' : isNearExpiry ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
              {format(new Date(row.expiryDate), 'dd/MM/yyyy')}
            </p>
            {isNearExpiry && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                ⚠ Hết hạn sau {diffDays} ngày
              </span>
            )}
            {isExpired && (
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
                🔴 ĐÃ HẾT HẠN
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Vị trí lưu trữ',
      accessor: (row) => <span className="text-xs text-slate-600 font-medium">{row.storageLocation}</span>,
    },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Hành động',
      accessor: (row) => (
        <button
          onClick={() => navigate(`/bc/inventory/${row._id}`)}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Chi tiết</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('inventory.title')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý lưu trữ túi máu, cập nhật trạng thái và thực hiện nhập/xuất kho
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/bc/inventory/stock-in')}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('inventory.stockIn')}</span>
          </button>
          <button
            onClick={() => navigate('/bc/inventory/stock-out')}
            className="px-3.5 py-2 bg-white text-red-600 border border-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{t('inventory.stockOut')}</span>
          </button>
          <button
            onClick={() => navigate('/bc/inventory/stats')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Thống kê kho</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng túi máu</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalBags}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Túi máu sẵn có</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{availableBags}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>Gần hết hạn (≤ 7 ngày)</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{nearExpiryBags}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã túi, Vị trí lưu trữ..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Nhóm máu:</span>
          {['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
            <button
              key={type}
              onClick={() => setBloodTypeFilter(type)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                bloodTypeFilter === type
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type === 'All' ? 'Tất cả' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <DataTable
        columns={columns}
        data={bags}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        emptyMessage="Không có túi máu nào phù hợp"
        rowClassName={(row) => {
          const diffDays = differenceInDays(new Date(row.expiryDate), new Date());
          if (diffDays < 0 || row.status === 'Expired') return 'bg-red-50/50';
          if (diffDays <= 7 && row.status === 'Available') return 'bg-amber-50/40';
          return '';
        }}
      />
    </div>
  );
};
