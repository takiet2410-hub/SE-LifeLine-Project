import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiService } from '../../../services/apiClient';
import type { NotificationData } from '../../../services/mockData';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import { format } from 'date-fns';

export const NotificationDetailPage: React.FC = () => {
  const { notifId } = useParams<{ notifId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.pathname.startsWith('/hospital') ? '/hospital/notifications' : '/bc/notifications';

  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (notifId) {
      apiService.getNotificationById(notifId).then((data) => {
        setNotification(data);
        if (data && !data.readAt) {
          apiService.markNotificationAsRead(data._id);
        }
        setLoading(false);
      });
    }
  }, [notifId]);

  if (loading) return <SkeletonLoader type="form" />;
  if (!notification) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Không tìm thấy thông báo.</p>
        <button
          onClick={() => navigate(backPath)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
        >
          Quay lại danh sách thông báo
        </button>
      </div>
    );
  }

  const isSOS = notification.type === 'SOS';
  const sosInfo = notification.sosRequestInfo;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(backPath)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chi Tiết Thông Báo</h2>
          <p className="text-xs text-slate-500">Mã thông báo: {notification._id}</p>
        </div>
      </div>

      {/* SOS Emergency Prominent Alert Banner (NFR-U-03) */}
      {isSOS && sosInfo && (
        <div className="bg-red-600 text-white rounded-xl p-6 shadow-lg shadow-red-200 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-red-500 pb-3">
            <div className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-wide">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span>🚨 YÊU CẦU MÁU CẤP CỨU (SOS EMERGENCY)</span>
            </div>
            <span className="bg-white text-red-700 text-xs font-black px-3 py-1 rounded-full uppercase">
              {sosInfo.urgencyLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-1">
            <div>
              <span className="text-red-200 text-xs block uppercase tracking-wider font-semibold">Nhóm máu cần</span>
              <span className="text-2xl font-black text-white">{sosInfo.bloodType}</span>
            </div>
            <div>
              <span className="text-red-200 text-xs block uppercase tracking-wider font-semibold">Thể tích cần</span>
              <span className="text-2xl font-black text-white">{sosInfo.requiredQuantityMl} ml</span>
            </div>
            <div>
              <span className="text-red-200 text-xs block uppercase tracking-wider font-semibold">Bệnh viện yêu cầu</span>
              <span className="font-bold text-white text-base truncate block">{sosInfo.hospitalName}</span>
            </div>
            <div>
              <span className="text-red-200 text-xs block uppercase tracking-wider font-semibold">Hạn hoàn tất</span>
              <span className="font-bold text-amber-200">
                {format(new Date(sosInfo.fulfillmentDeadline), 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
            <div>
              <span className="text-red-200 text-xs block uppercase tracking-wider font-semibold">Mã bệnh nhân</span>
              <span className="font-mono font-bold text-white">{sosInfo.patientReference}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={() => navigate('/bc/inventory')}
              className="px-4 py-2 bg-red-700 text-white hover:bg-red-800 font-bold text-xs rounded-lg shadow-xs transition-colors"
            >
              Kiểm tra kho máu
            </button>
            <button
              onClick={() => navigate(`/bc/inventory/stock-out?reason=Transfer`)}
              className="px-4 py-2 bg-white text-red-700 border border-white hover:bg-red-50 font-bold text-xs rounded-lg shadow-xs transition-colors"
            >
              Chuyển máu cho bệnh viện →
            </button>
          </div>
        </div>
      )}

      {/* Main Body Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">{notification.title}</h3>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')}
          </span>
        </div>

        <div className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
          {notification.body}
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Người gửi: <strong>{notification.senderName}</strong></span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã đọc
          </span>
        </div>
      </div>
    </div>
  );
};
