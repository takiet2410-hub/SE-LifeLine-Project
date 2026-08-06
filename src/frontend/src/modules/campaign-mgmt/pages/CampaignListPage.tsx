import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Users,
  Activity,
  Award,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../services/apiClient';
import type { CampaignData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DataTable } from '../../../components/common/DataTable';
import type { Column } from '../../../components/common/DataTable';
import { format } from 'date-fns';

export const CampaignListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

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

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await apiService.getCampaigns({ search: debouncedSearch, status: statusFilter });
      const items = Array.isArray(data) ? data : ((data as any)?.data || []);
      setCampaigns(items);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const totalPages = Math.ceil(campaigns.length / pageSize) || 1;
  const paginatedCampaigns = campaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculated Summary KPI Metrics
  const totalCount = campaigns.length;
  const activeCount = campaigns.filter((c) => c.status === 'Active').length;
  const totalRegistered = campaigns.reduce(
    (sum, c) => sum + (c.registeredCount || (c as any).capacityProgress?.registered || 0),
    0
  );
  const totalCapacity = campaigns.reduce(
    (sum, c) => sum + (c.capacity || (c as any).capacityProgress?.total || 0),
    0
  );

  const columns: Column<CampaignData>[] = [
    {
      header: 'Tên chiến dịch',
      accessor: (row: CampaignData) => {
        const id = row._id || (row as any).id;
        return (
          <div className="space-y-1">
            <p className="font-bold text-[#271816] text-[14px] hover:text-[#93000b] transition-colors cursor-pointer" onClick={() => navigate(`/bc/campaigns/${id}`)}>
              {row.name || 'Chiến dịch Hiến máu'}
            </p>
            <div className="flex items-center gap-1.5 text-[12px] text-[#6c757d]">
              <MapPin className="w-3.5 h-3.5 text-[#93000b] shrink-0" />
              <span className="truncate max-w-xs">{row.venue || (row as any).fullAddress || 'TP. Hồ Chí Minh'}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Thời gian',
      accessor: (row: CampaignData) => (
        <div className="text-[12px] space-y-0.5">
          <div className="flex items-center gap-1.5 text-[#271816] font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#93000b] shrink-0" />
            <span>{formatDateSafe(row.startDateTime)}</span>
          </div>
          <p className="text-[#6c757d] pl-5">
            đến {formatDateSafe(row.endDateTime)}
          </p>
        </div>
      ),
    },
    {
      header: 'Nhóm máu ưu tiên',
      accessor: (row: CampaignData) => {
        const groups = Array.isArray(row.targetBloodGroups) && row.targetBloodGroups.length > 0
          ? row.targetBloodGroups
          : ['A+', 'B+', 'O+'];
        return (
          <div className="flex flex-wrap gap-1">
            {groups.map((group, i) => (
              <span
                key={`${group}-${i}`}
                className="px-2 py-0.5 text-[11px] font-bold bg-red-50 text-[#93000b] rounded-md border border-red-200 shadow-2xs"
              >
                {group}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Tiến độ đăng ký',
      accessor: (row: CampaignData) => {
        const reg = row.registeredCount || (row as any).capacityProgress?.registered || 0;
        const cap = row.capacity || (row as any).capacityProgress?.total || 100;
        const percent = Math.min(100, Math.round((reg / Math.max(1, cap)) * 100));
        return (
          <div className="w-40">
            <div className="flex justify-between text-[12px] font-bold mb-1">
              <span className="text-[#271816]">{reg} / {cap} lượt</span>
              <span className="text-[#93000b]">{percent}%</span>
            </div>
            <div className="w-full h-2 bg-[#f1f3f5] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percent >= 100 ? 'bg-amber-500' : 'bg-[#93000b]'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Trạng thái',
      accessor: (row: CampaignData) => <StatusBadge status={row.status || 'Active'} />,
    },
    {
      header: 'Thao tác',
      accessor: (row: CampaignData) => {
        const id = row._id || (row as any).id;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/bc/campaigns/${id}`)}
              className="p-2 bg-white border border-[#f1f3f5] hover:bg-slate-50 hover:border-slate-300 rounded-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              title="Xem chi tiết chiến dịch"
            >
              <Eye className="w-4 h-4 text-[#93000b]" />
            </button>
            <button
              onClick={() => navigate(`/bc/campaigns/${id}/edit`)}
              className="p-2 bg-white border border-[#f1f3f5] hover:bg-slate-50 hover:border-slate-300 rounded-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              title="Chỉnh sửa thông tin chiến dịch"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => navigate(`/bc/campaigns/${id}/registrations`)}
              className="p-2 text-white bg-[#93000b] hover:bg-[#7a0009] rounded-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              title="Danh sách người đăng ký"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
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
              {t('campaign.title') || 'Quản Lý Chiến Dịch Hiến Máu'}
            </h2>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-red-50 text-[#93000b] border border-red-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#93000b]" />
              Live Feed
            </span>
          </div>
          <p className="text-[13px] font-normal text-[#6c757d] mt-1">
            Điều phối các đợt tiếp nhận máu lưu động, theo dõi tiến độ đăng ký và duyệt hồ sơ người hiến.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/bc/campaigns/create')}
            className="px-4.5 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[14px] font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chiến Dịch Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#93000b] flex items-center justify-center shrink-0 border border-red-100">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Tổng số chiến dịch</p>
            <p className="text-[24px] font-bold text-[#271816] leading-tight mt-0.5">{totalCount}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Đang tiếp nhận</p>
            <p className="text-[24px] font-bold text-emerald-700 leading-tight mt-0.5">{activeCount}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Tổng lượt đăng ký</p>
            <p className="text-[24px] font-bold text-[#271816] leading-tight mt-0.5">{totalRegistered}</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#f1f3f5] p-5 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#6c757d] uppercase tracking-wide">Chỉ tiêu dự kiến</p>
            <p className="text-[24px] font-bold text-[#271816] leading-tight mt-0.5">{totalCapacity} túi</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Control Bar */}
      <div className="bg-white p-4 border border-[#f1f3f5] rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#a3a3a3] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên chiến dịch, địa điểm..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[13px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Trạng thái:</span>
          {[
            { id: 'All', label: 'Tất cả' },
            { id: 'Draft', label: 'Bản nháp' },
            { id: 'Upcoming', label: 'Sắp diễn ra' },
            { id: 'Active', label: 'Đang mở' },
            { id: 'Completed', label: 'Đã hoàn thành' },
            { id: 'Cancelled', label: 'Đã hủy' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-[#93000b] text-white shadow-2xs'
                  : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign List Data Table */}
      <div className="bg-white border border-[#f1f3f5] rounded-2xl overflow-hidden shadow-2xs">
        <DataTable
          columns={columns}
          data={paginatedCampaigns}
          keyExtractor={(item: CampaignData) => item._id || (item as any).id || 'cam'}
          isLoading={loading}
          emptyMessage="Không tìm thấy chiến dịch hiến máu nào phù hợp với bộ lọc."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default CampaignListPage;
