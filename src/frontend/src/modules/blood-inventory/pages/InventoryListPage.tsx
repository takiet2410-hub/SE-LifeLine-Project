import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpRight, BarChart2, Search, Eye, AlertCircle, Package, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryApi } from '../services/inventoryApi';
import type { BloodBagData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DataTable } from '../../../components/common/DataTable';
import type { Column } from '../../../components/common/DataTable';
import { format, differenceInDays } from 'date-fns';

export const InventoryListPage: React.FC = () => {
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
    try {
      setLoading(true);
      const res = await inventoryApi.getInventory({
        page: currentPage,
        limit: pageSize,
        search: search.trim() || undefined,
        bloodType: bloodTypeFilter !== 'All' ? bloodTypeFilter : undefined,
        status: statusFilter !== 'All' ? (statusFilter as any) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const data = res.data;
      const items = Array.isArray(data) ? data : ((data as any)?.data || []);
      setBags(items);
      setTotalItems(res.pagination?.total || (res as any).total || items.length);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
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

  const hasActiveFilters = Boolean(
    search || bloodTypeFilter !== 'All' || statusFilter !== 'All' || startDate || endDate
  );

  const handleClearFilters = () => {
    setSearch('');
    setBloodTypeFilter('All');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

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
            className="px-3 py-1.5 bg-white border border-[#93000b] text-[#93000b] hover:bg-red-50 text-[12px] font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#93000b]" />
            <span>Chi tiết</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-[#f1f3f5] p-4.5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-[#93000b] flex items-center justify-center shrink-0 border border-red-100">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider truncate">Tổng túi trong kho</p>
            <p className="text-[22px] font-black text-[#271816] leading-tight mt-0.5">{totalBags}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#f1f3f5] p-4.5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider truncate">Sẵn có phát hành</p>
            <p className="text-[22px] font-black text-emerald-700 leading-tight mt-0.5">{availableBags}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-amber-50/70 border border-amber-200 p-4.5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider truncate">Cảnh báo (≤ 7 ngày)</p>
            <p className="text-[22px] font-black text-amber-900 leading-tight mt-0.5">{nearExpiryBags} túi</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#f1f3f5] p-4.5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <ArrowUpRight className="w-5 h-5 text-slate-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider truncate">Đã xuất / Sử dụng</p>
            <p className="text-[22px] font-black text-[#271816] leading-tight mt-0.5">{usedBags}</p>
          </div>
        </div>
      </div>

      {/* Filter, Search & Quick Actions Bar */}
      <div className="bg-white p-4 border border-[#f1f3f5] rounded-2xl shadow-2xs space-y-3">
        {/* Row 1: Search + Status + Date Range */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#a3a3a3] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo Mã túi, Vị trí lưu trữ..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[13px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
            />
          </div>

          {/* Status & Date Filter Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-[#6c757d] shrink-0">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[13px] font-semibold text-[#271816] outline-none cursor-pointer"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="Available">Sẵn có (Available)</option>
                <option value="Reserved">Đã giữ chỗ (Reserved)</option>
                <option value="Used">Đã xuất dùng (Used)</option>
                <option value="Expired">Hết hạn (Expired)</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 border-l border-[#f1f3f5] pl-2.5">
              <span className="text-[12px] font-semibold text-[#6c757d] shrink-0">Ngày lấy:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 px-2.5 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[12px] outline-none text-[#271816]"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 px-2.5 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[12px] outline-none text-[#271816]"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="h-10 px-3 text-[12px] font-medium text-[#6c757d] hover:text-[#93000b] hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Blood Type Selector (Left) + Action Buttons (Right) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-[#f1f3f5]">
          {/* Blood Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Nhóm máu:</span>
            {['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
              <button
                key={type}
                onClick={() => setBloodTypeFilter(type)}
                className={`h-9 px-3 text-[12px] font-bold rounded-xl transition-all shrink-0 cursor-pointer flex items-center justify-center ${
                  bloodTypeFilter === type
                    ? 'bg-[#93000b] text-white shadow-2xs'
                    : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
                }`}
              >
                {type === 'All' ? 'Tất cả' : type}
              </button>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 self-end lg:self-auto">
            <button
              onClick={() => {
                fetchInventory();
                toast.success('Đã làm mới dữ liệu kho máu!');
              }}
              className="h-9 w-9 bg-white border border-[#dee2e6] hover:bg-slate-50 text-[#6c757d] hover:text-[#271816] rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/bc/inventory/stats')}
              className="h-9 px-3 bg-[#1a1a2e] hover:bg-slate-900 text-white text-[12.5px] font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Thống Kê</span>
            </button>
            <button
              onClick={() => navigate('/bc/inventory/stock-out')}
              className="h-9 px-3.5 bg-white text-[#93000b] border border-[#93000b] hover:bg-red-50 text-[12.5px] font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98 shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Xuất Kho</span>
            </button>
            <button
              onClick={() => navigate('/bc/inventory/stock-in')}
              className="h-9 px-3.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[12.5px] font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nhập Kho</span>
            </button>
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
