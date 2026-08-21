import React from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  Calendar,
  Megaphone,
  HeartHandshake,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  PackageCheck,
  Truck,
  Building2,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NotificationData } from '../../../services/mockData';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { getArticleIdFromNotification, getArticleRouteForRole } from '../../../utils/notificationHelpers';

interface NotificationDetailModalProps {
  notification: NotificationData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!isOpen || !notification) return null;

  const titleLower = (notification.title || '').toLowerCase();
  const payload = notification.payload || {};

  const articleId = getArticleIdFromNotification(notification);
  const isArticle = !!articleId || notification.sourceRefType === 'Article' || titleLower.includes('bài viết');

  const isBloodCenterThankYou =
    titleLower.includes('trung tâm máu') &&
    (titleLower.includes('cảm ơn') || titleLower.includes('hoàn tất') || titleLower.includes('tri ân'));
  const isBloodReceipt =
    titleLower.includes('đã nhận máu') ||
    titleLower.includes('đã nhận đợt máu') ||
    titleLower.includes('tiếp nhận hiến máu') ||
    titleLower.includes('tiếp nhận thành công');
  const isShipment =
    titleLower.includes('vận chuyển') ||
    titleLower.includes('xuất kho') ||
    !!payload.shipmentCode;
  const isDonorThankYou =
    !isBloodCenterThankYou &&
    !isArticle &&
    (titleLower.includes('cảm ơn') || titleLower.includes('tri ân') || titleLower.includes('thành công'));
  const isBloodTestResult =
    titleLower.includes('kết quả') ||
    titleLower.includes('xét nghiệm') ||
    titleLower.includes('sàng lọc') ||
    titleLower.includes('bất thường');
  const isSOSAlert =
    (notification.type === 'SOS' || notification.sourceRefType === 'SOSRequest') &&
    !isBloodCenterThankYou &&
    !isBloodReceipt &&
    !isShipment &&
    !isDonorThankYou;
  const isAppointment =
    notification.type === 'Appointment' ||
    notification.sourceRefType === 'Appointment' ||
    titleLower.includes('lịch');
  const isCampaign =
    notification.type === 'Campaign' ||
    notification.sourceRefType === 'Campaign' ||
    titleLower.includes('chiến dịch');

  const resolveNotificationAction = () => {
    const isStaffOrAdmin =
      user?.role === 'Administrator' ||
      user?.role === 'BloodCenterStaff' ||
      user?.role === 'HospitalStaff';

    // 1. Article notification
    if (articleId) {
      return {
        label: 'Đọc bài viết chi tiết',
        route: getArticleRouteForRole(articleId, user?.role || location.pathname),
      };
    }

    // 2. SOS Alert / SOS Request / Shipment / Thank You / Completion
    if (payload.sosRequestId || isSOSAlert || isBloodCenterThankYou || isBloodReceipt || isShipment) {
      const sosId =
        payload.sosRequestId ||
        (notification.sourceRefId ? String(notification.sourceRefId) : null) ||
        (notification.body?.match(/([a-f0-9]{24})/i)?.[1]);

      if (user?.role === 'BloodCenterStaff' || location.pathname.startsWith('/bc')) {
        return {
          label: 'Xem chi tiết ca SOS',
          route: sosId ? `/bc/sos-requests/${sosId}` : '/bc/sos-requests',
        };
      }
      if (user?.role === 'HospitalStaff' || location.pathname.startsWith('/hospital')) {
        return {
          label: 'Xem chi tiết ca SOS',
          route: sosId ? `/hospital/sos-requests/${sosId}` : '/hospital/sos-requests',
        };
      }
      if (user?.role === 'Administrator' || location.pathname.startsWith('/admin')) {
        return {
          label: 'Xem nhật ký hệ thống',
          route: '/admin/logs',
        };
      }
      return {
        label: isSOSAlert ? 'Phản hồi ca cấp cứu SOS' : 'Xem chi tiết ca SOS',
        route: sosId ? `/sos-alerts/${sosId}` : '/sos-alerts',
      };
    }

    // 3. Campaign notifications
    if (isCampaign || payload.campaignId || notification.sourceRefType === 'Campaign') {
      const campaignId =
        payload.campaignId ||
        (notification.sourceRefId ? String(notification.sourceRefId) : null);

      if (user?.role === 'BloodCenterStaff' || location.pathname.startsWith('/bc')) {
        return {
          label: 'Xem quản lý chiến dịch',
          route: campaignId ? `/bc/campaigns/${campaignId}` : '/bc/campaigns',
        };
      }
      if (user?.role === 'Administrator' || location.pathname.startsWith('/admin')) {
        return {
          label: 'Xem bảng điều khiển',
          route: '/admin/dashboard',
        };
      }
      if (user?.role === 'HospitalStaff' || location.pathname.startsWith('/hospital')) {
        return {
          label: 'Xem yêu cầu SOS',
          route: '/hospital/sos-requests',
        };
      }
      return {
        label: 'Xem thông tin điểm hiến',
        route: '/find-locations',
      };
    }

    // 4. Appointment notifications
    if (isAppointment || payload.appointmentId || notification.sourceRefType === 'Appointment') {
      if (user?.role === 'BloodCenterStaff' || location.pathname.startsWith('/bc')) {
        return {
          label: 'Xem danh sách tiếp nhận',
          route: '/bc/campaigns',
        };
      }
      if (user?.role === 'Administrator' || location.pathname.startsWith('/admin')) {
        return {
          label: 'Xem bảng điều khiển',
          route: '/admin/dashboard',
        };
      }
      if (user?.role === 'HospitalStaff' || location.pathname.startsWith('/hospital')) {
        return {
          label: 'Xem yêu cầu SOS',
          route: '/hospital/sos-requests',
        };
      }
      return {
        label: 'Xem chi tiết lịch hẹn',
        route: '/my-appointments',
      };
    }

    // 5. Blood Test Results / Sàng lọc
    if (isBloodTestResult) {
      if (isStaffOrAdmin) {
        return {
          label: 'Xem bảng điều khiển',
          route:
            user?.role === 'Administrator'
              ? '/admin/dashboard'
              : user?.role === 'HospitalStaff'
              ? '/hospital/sos-requests'
              : '/bc/campaigns',
        };
      }
      return {
        label: 'Xem hồ sơ sức khỏe cá nhân',
        route: '/profile',
      };
    }

    // 6. Donor Thank You / Completion
    if (isDonorThankYou) {
      if (isStaffOrAdmin) {
        return {
          label: 'Xem bảng điều khiển',
          route:
            user?.role === 'Administrator'
              ? '/admin/dashboard'
              : user?.role === 'HospitalStaff'
              ? '/hospital/sos-requests'
              : '/bc/campaigns',
        };
      }
      return {
        label: 'Xem hồ sơ & thành tích',
        route: '/profile',
      };
    }

    // 7. Explicit deepLink with role-sanitization
    if (payload.deepLink) {
      let targetLink = String(payload.deepLink).trim();
      try {
        if (targetLink.startsWith('http://') || targetLink.startsWith('https://')) {
          const url = new URL(targetLink);
          targetLink = url.pathname + url.search;
        }
      } catch {}

      if (isStaffOrAdmin) {
        if (
          targetLink.startsWith('/profile') ||
          targetLink.startsWith('/my-appointments') ||
          targetLink.startsWith('/news')
        ) {
          if (user?.role === 'Administrator') targetLink = '/admin/dashboard';
          else if (user?.role === 'BloodCenterStaff') targetLink = '/bc/campaigns';
          else if (user?.role === 'HospitalStaff') targetLink = '/hospital/sos-requests';
        }
      }

      if (targetLink && targetLink !== '/' && !targetLink.includes('/undefined')) {
        return {
          label: 'Xem trang liên quan',
          route: targetLink,
        };
      }
    }

    // 8. Default fallback based on active role
    if (user?.role === 'Administrator') {
      return { label: 'Xem bảng điều khiển', route: '/admin/dashboard' };
    }
    if (user?.role === 'BloodCenterStaff') {
      return { label: 'Xem quản lý chiến dịch', route: '/bc/campaigns' };
    }
    if (user?.role === 'HospitalStaff') {
      return { label: 'Xem yêu cầu SOS', route: '/hospital/sos-requests' };
    }
    return { label: 'Xem hồ sơ cá nhân', route: '/profile' };
  };

  const action = resolveNotificationAction();

  const handleActionClick = () => {
    onClose();
    if (action.route) {
      navigate(action.route);
    }
  };

  // Header background & styling
  const getHeaderGradient = () => {
    if (isArticle) return 'bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-800';
    if (isSOSAlert) return 'bg-gradient-to-r from-red-700 to-red-800 text-white border-red-800';
    if (isBloodCenterThankYou) return 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-700';
    if (isBloodReceipt) return 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-700';
    if (isShipment) return 'bg-gradient-to-r from-indigo-600 to-sky-700 text-white border-indigo-700';
    if (isDonorThankYou) return 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-700';
    if (isBloodTestResult) return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600';
    if (isAppointment) return 'bg-gradient-to-r from-sky-600 to-cyan-700 text-white border-sky-700';
    if (isCampaign) return 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-purple-700';
    return 'bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-800';
  };

  const getBadgeLabel = () => {
    if (isArticle) return '📰 Bài viết tin tức';
    if (isSOSAlert) return '🚨 Khẩn cấp SOS';
    if (isBloodCenterThankYou) return '🏆 Tri ân Trung tâm máu';
    if (isBloodReceipt) return '📦 Tiếp nhận đợt máu';
    if (isShipment) return '🚚 Vận chuyển máu';
    if (isDonorThankYou) return '❤️ Tri ân người hiến';
    if (isBloodTestResult) return '🩺 Kết quả xét nghiệm';
    if (isAppointment) return '📅 Lịch hẹn';
    if (isCampaign) return '📢 Chiến dịch';
    return '🔔 Thông báo';
  };

  const getHeaderIcon = () => {
    if (isArticle) return <FileText className="w-6 h-6" />;
    if (isSOSAlert) return <AlertTriangle className="w-6 h-6" />;
    if (isBloodCenterThankYou) return <Award className="w-6 h-6" />;
    if (isBloodReceipt) return <PackageCheck className="w-6 h-6" />;
    if (isShipment) return <Truck className="w-6 h-6" />;
    if (isDonorThankYou) return <HeartHandshake className="w-6 h-6" />;
    if (isBloodTestResult) return <ShieldCheck className="w-6 h-6" />;
    if (isAppointment) return <Calendar className="w-6 h-6" />;
    if (isCampaign) return <Megaphone className="w-6 h-6" />;
    return <Bell className="w-6 h-6" />;
  };

  const isSOSType = notification.type === 'SOS' || notification.sourceRefType === 'SOSRequest' || isSOSAlert;
  const fastTrackCode = isSOSType && notification._id ? `SOS-${notification._id.slice(-6).toUpperCase()}` : null;

  const hasMetrics =
    payload.volume ||
    payload.volumeMl ||
    payload.totalVolumeMl ||
    payload.bloodType ||
    payload.donationDate ||
    payload.nextEligibleDate ||
    payload.campaignName ||
    payload.shipmentCode ||
    payload.hospitalName ||
    fastTrackCode ||
    (payload.receivedQuantityMl !== undefined && payload.requiredQuantityMl !== undefined);

  const displayVolume = payload.volume || payload.volumeMl || payload.totalVolumeMl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${getHeaderGradient()}`}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isSOSAlert
                  ? 'bg-white text-red-700 animate-pulse'
                  : 'bg-white/20 text-white backdrop-blur-xs'
              }`}
            >
              {getHeaderIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                    isSOSAlert
                      ? 'bg-white text-red-700'
                      : 'bg-white/25 text-white'
                  }`}
                >
                  {getBadgeLabel()}
                </span>
                <span className="text-[11px] text-white/80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {notification.createdAt
                    ? format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')
                    : ''}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
                {notification.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Structured Data Badges Card */}
          {hasMetrics && (
            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 space-y-2.5">
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#93000b]" />
                Thông tin chi tiết
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {fastTrackCode && (
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-xs text-slate-500 block">Mã tiếp nhận ưu tiên:</span>
                    <span className="font-mono font-bold text-red-600">{fastTrackCode}</span>
                  </div>
                )}
                {payload.shipmentCode && (
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-xs text-slate-500 block">Mã vận đơn:</span>
                    <span className="font-mono font-bold text-blue-700">{payload.shipmentCode}</span>
                  </div>
                )}
                {payload.bloodType && (
                  <div>
                    <span className="text-xs text-slate-500 block">Nhóm máu:</span>
                    <span className="font-extrabold text-[#93000b] text-base">{payload.bloodType}</span>
                  </div>
                )}
                {displayVolume && (
                  <div>
                    <span className="text-xs text-slate-500 block">Lượng máu:</span>
                    <span className="font-bold text-slate-800">{displayVolume} ml</span>
                  </div>
                )}
                {payload.receivedQuantityMl !== undefined && payload.requiredQuantityMl !== undefined && (
                  <div>
                    <span className="text-xs text-slate-500 block">Tiến độ tiếp nhận:</span>
                    <span className="font-bold text-emerald-700">
                      {payload.receivedQuantityMl} / {payload.requiredQuantityMl} ml
                    </span>
                  </div>
                )}
                {payload.campaignName && (
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500 block">Địa điểm / Chiến dịch:</span>
                    <span className="font-bold text-slate-800">{payload.campaignName}</span>
                  </div>
                )}
                {payload.hospitalName && (
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500 block">Bệnh viện:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {payload.hospitalName}
                    </span>
                  </div>
                )}
                {payload.donationDate && (
                  <div>
                    <span className="text-xs text-slate-500 block">Ngày hiến:</span>
                    <span className="font-medium text-slate-700">{payload.donationDate}</span>
                  </div>
                )}
                {payload.nextEligibleDate && (
                  <div>
                    <span className="text-xs text-slate-500 block">Có thể hiến lại từ:</span>
                    <span className="font-bold text-emerald-700">{payload.nextEligibleDate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Message Text */}
          <div className="bg-white rounded-2xl">
            <div className="text-slate-800 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-line font-normal">
              {notification.body}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleActionClick}
            className="px-5 py-2.5 rounded-xl bg-[#93000b] hover:bg-[#780009] text-white text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{action.label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
