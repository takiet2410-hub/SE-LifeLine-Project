import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, MapPin, ListChecks } from 'lucide-react';
import { apiService } from '../../../services/apiClient';
import type { CampaignData } from '../../../services/mockData';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { format } from 'date-fns';

export const CampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      apiService.getCampaignById(campaignId).then((data) => {
        setCampaign(data);
        setLoading(false);
      });
    }
  }, [campaignId]);

  if (loading) return <SkeletonLoader type="form" />;
  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Không tìm thấy chiến dịch hiến máu.</p>
        <button
          onClick={() => navigate('/bc/campaigns')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((campaign.registeredCount / campaign.capacity) * 100));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bc/campaigns')}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{campaign.name}</h2>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Mã chiến dịch: {campaign._id}</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/bc/campaigns/${campaign._id}/registrations`)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
        >
          <ListChecks className="w-4 h-4" />
          <span>Danh sách đăng ký ({campaign.registeredCount})</span>
        </button>
      </div>

      {/* Stats Progress Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-red-600" />
          <span>Tiến độ tiếp nhận chỉ tiêu</span>
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-slate-700">Đã đăng ký: {campaign.registeredCount} người</span>
            <span className="text-slate-900">Chỉ tiêu: {campaign.capacity} người ({percent}%)</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percent >= 100 ? 'bg-amber-500' : 'bg-red-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Info Details Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Thông tin chi tiết đợt hiến máu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Địa điểm tổ chức</p>
            <p className="mt-1 font-medium text-slate-800 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{campaign.venue}</span>
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thời gian diễn ra</p>
            <p className="mt-1 font-medium text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                {format(new Date(campaign.startDateTime), 'dd/MM/yyyy HH:mm')} —{' '}
                {format(new Date(campaign.endDateTime), 'dd/MM/yyyy HH:mm')}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nhóm máu ưu tiên</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {campaign.targetBloodGroups.map((group) => (
                <span
                  key={group}
                  className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 rounded-md border border-red-200"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ngày khởi tạo</p>
            <p className="mt-1 font-medium text-slate-800">
              {format(new Date(campaign.createdAt), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
