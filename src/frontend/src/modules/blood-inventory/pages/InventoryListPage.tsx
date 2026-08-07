import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpRight, BarChart2, Search, Eye, AlertCircle, Package, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '../services/inventoryApi';
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
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const pageSize = 8;

  const formatDateSafe = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, 'dd/MM/yyyy');
    } catch {
      return 'N/A';
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getInventory({ page: currentPage, limit: pageSize, search, bloodType: bloodTypeFilter, status: statusFilter, startDate, endDate });
      const data = res.data; // Using res.data from InventoryListResponse
      const items = Array.isArray(data) ? data : ((data as any)?.data || []);
      setBags(items);
      setTotalItems(res.pagination?.total || 0);
      setSummary(res.summary || null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setBags([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, bloodTypeFilter, statusFilter, startDate, endDate]);

  // Fetch data when filters or page changes
  useEffect(() => {
    fetchInventory();
  }, [currentPage, search, bloodTypeFilter, statusFilter, startDate, endDate]);

  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBags = bags;

  const totalBags = summary?.totalBags || 0;
  const availableBags = summary?.availableBags || 0;
  const nearExpiryBags = summary?.nearExpiryCount || 0;
  const usedBags = summary?.usedBags || 0;

  const columns: Column<BloodBagData>[] = [
    {
      header: 'Mã Túi Máu & Mã Định Danh',
      accessor: (row: BloodBagData) => {
        const id = row._id || (row as any).id || 'bag';
        return (
          <div className="space-y-0.5">
            <p className="font-bold text-[#271816] font-mono text-[14px]">{row.bagCode || `BB-2026-${id.slice(-4)}`}</p>
            <p className="text-[11px] text-[#6c757d]">ID: {id}</p>
          </div>
        );
      },
    },
    {
      header: 'Nhóm Máu',
      accessor: (row: BloodBagData) => (
        <span className="px-2.5 py-1 text-[12px] font-black bg-[#93000b] text-white rounded-md shadow-2xs">
          {row.bloodType || 'O+'}
        </span>
      ),
    },
    {
      header: 'Thể Tích',
      accessor: (row: BloodBagData) => <span className="font-semibold text-[#271816] text-[13px]">{row.volumeMl || 350} ml</span>,
    },
    {
      header: 'Hạn Sử Dụng (FEFO)',
      accessor: (row: BloodBagData) => {
        let diffDays = 30;
        try {
          diffDays = differenceInDays(new Date(row.expiryDate), new Date());
        } catch {
          diffDays = 30;
        }

        const isNearExpiry = diffDays >= 0 && diffDays <= 7 && row.status === 'Available';
        const isExpired = diffDays < 0 || row.status === 'Expired';

        return (
          <div className="space-y-1">
            <p className={`font-medium text-[12px] ${isExpired ? 'text-red-700 font-bold' : isNearExpiry ? 'text-amber-700 font-bold' : 'text-[#271816]'}`}>
              {formatDateSafe(row.expiryDate)}
            </p>
            {isNearExpiry && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                ⚠ Hết hạn sau {diffDays} ngày
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                🔴 Đã Hết Hạn
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Vị Trí Lưu Trữ',
      accessor: (row: BloodBagData) => (
        <span className="text-[12px] text-[#271816] font-medium px-2.5 py-1 bg-slate-100 rounded-md border border-[#f1f3f5]">
          {row.storageLocation || 'Khu A - Tủ đông 01'}
        </span>
      ),
    },
    {
      header: 'Trạng Thái',
      accessor: (row: BloodBagData) => <StatusBadge status={row.status || 'Available'} />,
    },
    {
      header: 'Thao Tác',
      accessor: (row: BloodBagData) => {
        const id = row._id || (row as any).id;
        return (
          <button
            onClick={() => navigate(`/bc/inventory/${id}`)}
            className="px-3 py-1.5 text-[12px] font-semibold text-[#271816] bg-white border border-[#f1f3f5] hover:bg-slate-50 hover:border-slate-300 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#93000b]" />
            <span>Chi tiết</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#f1f3f5] p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-bold text-[#271816] tracking-tight">
              {t('inventory.title') || 'Quản Lý Kho Túi Máu'}
            </h2>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-red-50 text-[#93000b] border border-red-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#93000b]" />
              FEFO Priority
            </span>
          </div>
          <p className="text-[13px] font-normal text-[#6c757d] mt-1">
            Theo dõi vị trí lưu trữ, cảnh báo hạn sử dụng FEFO và điều phối xuất nhập kho chuẩn ISO.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/bc/inventory/stock-in')}
            className="px-4 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Nhập Kho (Stock In)</span>
          </button>
          <button
            onClick={() => navigate('/bc/inventory/stock-out')}
            className="px-4 py-2.5 bg-white text-[#93000b] border border-[#93000b] hover:bg-red-50 text-[13px] font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Xuất Kho (Stock Out)</span>
          </button>
          <button
            onClick={() => navigate('/bc/inventory/stats')}
            className="px-4 py-2.5 bg-[#1a1a2e] hover:bg-slate-900 text-white text-[13px] font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Thống Kê</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#93000b] flex items-center justify-center shrink-0 border border-red-100">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Tổng túi trong kho</p>
            <p className="text-[24px] font-bold text-[#271816] leading-tight mt-0.5">{totalBags}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Sẵn có phát hành</p>
            <p className="text-[24px] font-bold text-emerald-700 leading-tight mt-0.5">{availableBags}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-amber-800 uppercase tracking-wide">Cảnh báo (≤ 7 ngày)</p>
            <p className="text-[24px] font-bold text-amber-900 leading-tight mt-0.5">{nearExpiryBags} túi</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <ArrowUpRight className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Đã xuất / Sử dụng</p>
            <p className="text-[24px] font-bold text-[#271816] leading-tight mt-0.5">{usedBags}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-[#f1f3f5] rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#a3a3a3] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã túi, Vị trí lưu trữ..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[13px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Nhóm máu:</span>
            {['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
              <button
                key={type}
                onClick={() => setBloodTypeFilter(type)}
                className={`px-2.5 py-1 text-[12px] font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                  bloodTypeFilter === type
                    ? 'bg-[#93000b] text-white shadow-2xs'
                    : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
                }`}
              >
                {type === 'All' ? 'Tất cả' : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-[#f1f3f5] pl-3">
            <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Trạng thái:</span>
            {['All', 'Available', 'Reserved', 'Used', 'Expired'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[12px] font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#1a1a2e] text-white shadow-2xs'
                    : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
                }`}
              >
                {st === 'All' ? 'Tất cả' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-[#f1f3f5] pl-3">
            <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Ngày lấy:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[12px] outline-none"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[12px] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="bg-white border border-[#f1f3f5] rounded-2xl overflow-hidden shadow-2xs">
        <DataTable
          columns={columns}
          data={paginatedBags}
          keyExtractor={(item: BloodBagData) => item._id || (item as any).id || 'bag'}
          isLoading={loading}
          emptyMessage="Không tìm thấy túi máu nào trong kho."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          rowClassName={(row: BloodBagData) => {
            try {
              const diffDays = differenceInDays(new Date(row.expiryDate), new Date());
              if (diffDays < 0 || row.status === 'Expired') return 'bg-red-50/50';
              if (diffDays <= 7 && row.status === 'Available') return 'bg-amber-50/40';
            } catch {}
            return '';
          }}
        />
      </div>
    </div>
  );
};

export default InventoryListPage;
