import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Search, Eye } from 'lucide-react';
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

  useEffect(() => {
    if (campaignId) {
      apiService.getCampaignById(campaignId).then((c) => setCampaign(c));
    }
  }, [campaignId]);

  const fetchRegistrations = async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const data = await apiService.getRegistrations(campaignId, search, statusFilter);
      setRegistrations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [campaignId, search, statusFilter]);

  const columns: Column<RegistrationData>[] = [
    {
      header: 'Mã Đăng Ký / CCCD',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row._id}</p>
          <p className="text-xs text-slate-400 font-mono">CCCD: {row.donorIdCard.replace(/(\d{4})\d{4}(\d{4})/, '$1****$2')}</p>
        </div>
      ),
    },
    {
      header: 'Người hiến máu',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.donorName}</p>
          <p className="text-xs text-slate-500">{row.donorPhone}</p>
        </div>
      ),
    },
    {
      header: 'Nhóm máu',
      accessor: (row) => (
        <span className="px-2 py-0.5 font-bold text-xs bg-red-100 text-red-700 rounded-md border border-red-200">
          {row.donorBloodType}
        </span>
      ),
    },
    {
      header: 'Thời gian đặt hẹn',
      accessor: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {format(new Date(row.appointmentDate), 'dd/MM/yyyy HH:mm')}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Hành động',
      accessor: (row) => (
        <button
          onClick={() =>
            navigate(`/bc/campaigns/${campaignId}/registrations/${row._id}`)
          }
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Sàng lọc & Chi tiết</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/bc/campaigns/${campaignId}`)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Danh Sách Đăng Ký Hiến Máu</h2>
            <p className="text-xs text-slate-500">
              Chiến dịch: <span className="font-semibold text-slate-700">{campaign?.name || campaignId}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/bc/campaigns/${campaignId}/qr-scan`)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <QrCode className="w-4 h-4" />
          <span>Quét Mã QR Phiếu Đăng Ký</span>
        </button>
      </div>

      {/* Filter and Auto-suggest Search */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã phiếu, Tên, Số CCCD..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Trạng thái:</span>
          {['All', 'Registered', 'CheckedIn', 'Eligible', 'Completed', 'Ineligible'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? 'Tất cả' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={registrations}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        emptyMessage="Chưa có lượt đăng ký nào tương ứng"
      />
    </div>
  );
};
