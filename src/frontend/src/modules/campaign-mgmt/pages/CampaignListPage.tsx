import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, MapPin, Eye } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await apiService.getCampaigns({ search, status: statusFilter });
      setCampaigns(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [search, statusFilter]);

  const columns: Column<CampaignData>[] = [
    {
      header: 'Tên chiến dịch',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-xs">{row.venue}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Thời gian',
      accessor: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{format(new Date(row.startDateTime), 'dd/MM/yyyy')}</span>
          </div>
          <p className="text-slate-400 pl-5">
            đến {format(new Date(row.endDateTime), 'dd/MM/yyyy')}
          </p>
        </div>
      ),
    },
    {
      header: 'Nhóm máu ưu tiên',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.targetBloodGroups.map((group) => (
            <span
              key={group}
              className="px-1.5 py-0.5 text-[11px] font-bold bg-red-50 text-red-700 rounded-md border border-red-200"
            >
              {group}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Chỉ tiêu',
      accessor: (row) => {
        const percent = Math.min(100, Math.round((row.registeredCount / row.capacity) * 100));
        return (
          <div className="w-36">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700">{row.registeredCount} / {row.capacity}</span>
              <span className="text-slate-500">{percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percent >= 100 ? 'bg-amber-500' : 'bg-red-600'
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
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Hành động',
      accessor: (row) => (
        <button
          onClick={() => navigate(`/bc/campaigns/${row._id}`)}
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
          <h2 className="text-xl font-bold text-slate-900">{t('campaign.title')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các đợt hiến máu lưu động và theo dõi chỉ tiêu đăng ký
          </p>
        </div>
        <button
          onClick={() => navigate('/bc/campaigns/create')}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-red-900/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('campaign.createNew')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên chiến dịch, địa điểm..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Lọc theo:</span>
          {['All', 'Active', 'Full', 'Draft', 'Closed'].map((st) => (
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

      {/* Campaign List Table */}
      <DataTable
        columns={columns}
        data={campaigns}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        emptyMessage="Không tìm thấy chiến dịch hiến máu nào"
      />
    </div>
  );
};
