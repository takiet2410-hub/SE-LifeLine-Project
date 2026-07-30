import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Search, Sparkles, Eye, HelpCircle } from 'lucide-react';
import { apiService } from '../../../services/apiClient';
import type { RegistrationData, CampaignData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { DataTable } from '../../../components/common/DataTable';
import type { Column } from '../../../components/common/DataTable';
import { format } from 'date-fns';

export const RegistrationListPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const formatDateSafe = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, 'dd/MM/yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  useEffect(() => {
    if (campaignId && campaignId !== 'all') {
      apiService.getCampaignById(campaignId).then((c) => setCampaign(c));
    }
  }, [campaignId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRegistrations(campaignId || 'all', search, statusFilter);
      setRegistrations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    setCurrentPage(1);
  }, [campaignId, search, statusFilter]);

  const totalPages = Math.ceil(registrations.length / pageSize) || 1;
  const paginatedRegistrations = registrations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<RegistrationData>[] = [
    {
      header: 'Mã Phiếu & CCCD',
      accessor: (row: RegistrationData) => {
        const code = row._id ? `#REG-${row._id.slice(-6).toUpperCase()}` : '#REG-8821';
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1a1a2e] text-white rounded">
                {code}
              </span>
            </div>
            <p className="text-[11px] text-[#6c757d] font-mono">
              CCCD: {row.donorIdCard ? row.donorIdCard.replace(/(\d{4})\d{4}(\d{4})/, '$1****$2') : 'Chưa cập nhật'}
            </p>
          </div>
        );
      },
    },
    {
      header: 'Họ tên & Số điện thoại',
      accessor: (row: RegistrationData) => {
        const name = row.donorName || (row as any).donor?.fullName || (row as any).donorId?.fullName || 'Người hiến máu';
        const phone = row.donorPhone || (row as any).donor?.phoneNumber || (row as any).donorId?.phone || 'Chưa cập nhật SĐT';
        return (
          <div>
            <p className="font-bold text-[#271816] text-[14px]">{name}</p>
            <p className="text-[12px] text-[#6c757d]">{phone}</p>
          </div>
        );
      },
    },
    {
      header: 'Nhóm máu',
      accessor: (row: RegistrationData) => {
        const bt = row.donorBloodType;
        if (!bt || bt === 'Unknown' || bt === 'Chưa biết' || bt === 'Chưa xác định' || bt === '?') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md border border-slate-200" title="Chưa biết nhóm máu">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Chưa biết</span>
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 font-extrabold text-[12px] bg-red-50 text-[#93000b] rounded-md border border-red-200 shadow-2xs">
            {bt}
          </span>
        );
      },
    },
    {
      header: 'Giờ hẹn tiếp nhận',
      accessor: (row: RegistrationData) => (
        <span className="text-[12px] text-[#271816] font-semibold">
          {formatDateSafe(row.appointmentDate)}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (row: RegistrationData) => <StatusBadge status={row.status || 'CheckedIn'} />,
    },
    {
      header: 'Thao tác',
      accessor: (row: RegistrationData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/bc/campaigns/${campaignId || 'all'}/registrations/${row._id}`)
            }
            className="px-3.5 py-1.5 text-[12px] font-semibold text-white bg-[#93000b] hover:bg-[#7a0009] rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-white" />
            <span>Chi tiết</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#f1f3f5] p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bc/campaigns')}
            className="p-2 rounded-xl text-[#6c757d] hover:text-[#271816] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Quay lại Quản lý Chiến dịch"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-bold text-[#271816] tracking-tight">
                Phê Duyệt Đơn Sàng Lọc Người Hiến Máu
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-red-50 text-[#93000b] border border-red-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#93000b]" />
                Live List
              </span>
            </div>
            <p className="text-[13px] text-[#6c757d] mt-0.5">
              Chiến dịch: <span className="font-bold text-[#271816]">{campaign?.name || 'Tất cả các đợt tiếp nhận máu'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/bc/campaigns/${campaignId || 'all'}/qr-scan`)}
          className="px-4 py-2.5 bg-[#1a1a2e] hover:bg-slate-900 text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-red-400" />
          <span>Quét QR Điểm Danh & Sàng Lọc</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#white] p-4 border border-[#f1f3f5] rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#a3a3a3] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã phiếu, Tên, Số CCCD..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[13px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <span className="text-[12px] font-semibold text-[#6c757d] shrink-0 mr-1">Trạng thái:</span>
          {['All', 'Pending', 'Confirmed', 'Rejected', 'CheckedIn', 'Eligible', 'Ineligible', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#93000b] text-white shadow-2xs'
                  : 'bg-white text-[#5b403d] border border-[#f1f3f5] hover:bg-slate-50'
              }`}
            >
              {st === 'All' ? 'Tất cả' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#f1f3f5] rounded-2xl overflow-hidden shadow-2xs">
        <DataTable
          columns={columns}
          data={paginatedRegistrations}
          keyExtractor={(item: RegistrationData) => item._id || (item as any).id || 'reg'}
          isLoading={loading}
          emptyMessage="Chưa có phiếu sàng lọc nào phù hợp với bộ lọc."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default RegistrationListPage;
