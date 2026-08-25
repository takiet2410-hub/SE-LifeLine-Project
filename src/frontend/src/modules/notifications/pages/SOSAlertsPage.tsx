import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, Heart, HeartHandshake, ShieldAlert, Check, X, MapPin as MapPinIcon, Phone as PhoneIcon, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { type SOSUrgency } from '../../sos-requests/services/sosApi';
import { apiService } from '../../../services/apiClient';
import { HospitalMapModal } from '../../sos-requests/components/HospitalMapModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

interface SOSAlert {
  id: string;
  sosRequestId: string;
  bloodType: string;
  urgencyLevel: SOSUrgency;
  status: string;
  hospitalName: string;
  hospitalAddress: string;
  patientReference: string;
  requiredQuantityMl: number;
  fulfillmentDeadline: string;
  createdAt: string;
  readAt: string | null;
  donorResponse?: 'accepted' | 'declined' | null;
  hospitalLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  hospitalPhone?: string;
}

type ResponseStatus = 'idle' | 'accepted' | 'declined' | 'ineligible' | 'fulfilled' | 'expired';

const getTerminalResponseStatus = (alert: SOSAlert): ResponseStatus | null => {
  if (alert.status === 'Fulfilled') return 'fulfilled';
  if (['Expired', 'Cancelled', 'EvaluationFailed'].includes(alert.status)) return 'expired';
  const deadline = Date.parse(alert.fulfillmentDeadline);
  return Number.isFinite(deadline) && deadline <= Date.now() ? 'expired' : null;
};

export const SOSAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [responseStatus, setResponseStatus] = useState<ResponseStatus>('idle');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [pendingResponse, setPendingResponse] = useState<{ alert: SOSAlert; response: 'accepted' | 'declined' } | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      // Fetch SOS notifications for the donor
      const result = await apiService.getNotifications({ type: 'SOS' });
      const notifications = result?.data ?? [];
      
      const sosAlerts: SOSAlert[] = (notifications || [])
        .filter((notif: any) => {
          const payload = notif.payload || notif.sosRequestInfo || {};
          const title = (notif.title || '').toLowerCase();
          // Filter out completion / thank-you / dispatch status notifications
          if (
            title.includes('hoàn tất') || 
            title.includes('tiếp nhận hiến máu') || 
            title.includes('đã nhận máu') || 
            title.includes('máu từ kho')
          ) {
            return false;
          }
          // Must have valid blood request info
          return (payload.bloodType && payload.bloodType !== 'Unknown') || (payload.hospitalName && payload.hospitalName !== 'Unknown Hospital');
        })
        .map((notif: any) => {
          const payload = notif.payload || notif.sosRequestInfo || {};
          const sosReqId = notif.sourceRefId || payload.sosRequestId || notif.referenceId || payload.id || notif._id;
          return {
            id: notif._id,
            sosRequestId: String(sosReqId),
            bloodType: payload.bloodType || 'Unknown',
            urgencyLevel: payload.urgencyLevel || 'High',
            status: payload.status || notif.status || 'NotificationsDispatched',
            hospitalName: payload.hospitalName || 'Bệnh viện đối tác LifeLine',
            hospitalAddress: payload.hospitalAddress || 'Address not available',
            patientReference: payload.patientReference || 'N/A',
            requiredQuantityMl: payload.requiredQuantityMl || 250,
            fulfillmentDeadline: payload.fulfillmentDeadline || notif.createdAt || new Date().toISOString(),
            createdAt: notif.createdAt || new Date().toISOString(),
            readAt: notif.readAt || null,
            donorResponse: payload.donorResponse || null,
            hospitalLocation: payload.hospitalLocation,
            hospitalPhone: payload.hospitalPhone || '02838554137',
          };
        });
      
      setAlerts(sosAlerts);
    } catch (error) {
      console.error('Failed to fetch SOS alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const handleUpdate = () => {
      fetchAlerts();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, []);

  const handleAccept = async (alert: SOSAlert) => {
    try {
      await apiService.respondToSOS(alert.id, 'accepted');
      
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? { ...a, donorResponse: 'accepted' } : a
      ));
      setResponseStatus('accepted');
      setSelectedAlert(alert);
      setShowDetail(true);
      toast.success('Cảm ơn bạn! Phản hồi sẵn sàng hiến máu đã được ghi nhận.');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Không thể ghi nhận phản hồi';
      toast.error(msg);
    }
  };

  const handleDecline = async (alert: SOSAlert) => {
    try {
      await apiService.respondToSOS(alert.id, 'declined');
      
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? { ...a, donorResponse: 'declined' } : a
      ));
      setResponseStatus('declined');
      setSelectedAlert(alert);
      setShowDetail(true);
      toast.info('Đã ghi nhận phản hồi. Cảm ơn bạn!');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Không thể ghi nhận phản hồi';
      toast.error(msg);
    }
  };

  const handleDismiss = (alert: SOSAlert) => {
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
    toast.info('Alert dismissed');
  };

  const handleCardClick = async (alert: SOSAlert) => {
    // 1. Always mark as read if it's currently unread
    if (!alert.readAt) {
      try {
        await apiService.markNotificationAsRead(alert.id);
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, readAt: new Date().toISOString() } : a));
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }

    // 2. Terminal alerts remain available as history, but must not show active instructions.
    setSelectedAlert(alert);
    setResponseStatus(getTerminalResponseStatus(alert) || alert.donorResponse || 'idle');
    setShowDetail(true);
  };

  const getUrgencyColor = (urgency: SOSUrgency) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getUrgencyIcon = (urgency: SOSUrgency) => {
    switch (urgency) {
      case 'Critical': return <ShieldAlert className="w-5 h-5" />;
      case 'High': return <AlertTriangle className="w-5 h-5" />;
      case 'Medium': return <Clock className="w-5 h-5" />;
    }
  };

  const getUrgencyLabel = (urgency: SOSUrgency) => {
    switch (urgency) {
      case 'Critical': return 'Khẩn cấp tối đa';
      case 'High': return 'Mức độ cao';
      case 'Medium': return 'Trung bình';
      default: return urgency;
    }
  };

  const unreadCount = alerts.filter(a => !a.readAt).length;

  // Response Detail Content
  const renderResponseDetail = () => {
    if (!selectedAlert) return null;

    switch (responseStatus) {
      case 'accepted':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <HeartHandshake className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-700">Cảm Ơn Bạn Đã Sẵn Sàng Cứu Người!</h3>
              <p className="text-gray-600 mt-2">Phản hồi sẵn sàng hiến máu cấp cứu của bạn đã được ghi nhận.</p>
              <div className="inline-flex max-w-md items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 mt-3">
                <span>Đây là cam kết sẵn sàng hỗ trợ, chưa phải xác nhận đã hiến máu. Điểm và huy hiệu chỉ được cộng sau khi bệnh viện tiếp nhận máu.</span>
              </div>
            </div>
            
            <div className="bg-green-50/70 rounded-xl p-4 border border-green-200 space-y-3">
              {/* Fast Track Code */}
              <div className="p-3 bg-white rounded-lg border border-green-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mã tiếp nhận ưu tiên cấp cứu</span>
                  <p className="text-lg font-bold text-red-600 font-mono">SOS-{(selectedAlert.id || '').slice(-6).toUpperCase()}</p>
                </div>
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md">Ưu tiên số 1</span>
              </div>

              <h4 className="font-semibold text-green-800 flex items-center gap-2 pt-1">
                <MapPinIcon className="w-5 h-5" />
                Hướng dẫn & Điểm đến
              </h4>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <MapPinIcon className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">{selectedAlert.hospitalName}</p>
                    <p className="text-xs text-gray-600">{selectedAlert.hospitalAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <Clock className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Thời gian đến viện</p>
                    <p className="text-xs text-gray-600">Trước: {format(new Date(selectedAlert.fulfillmentDeadline), 'HH:mm - dd/MM/yyyy')}</p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/70 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    Lưu ý chuẩn bị trước khi đến:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900/90 pl-1">
                    <li>Mang theo CCCD hoặc ứng dụng VNeID.</li>
                    <li>Không uống rượu, bia hoặc chất kích thích trong vòng 24h.</li>
                    <li>Nên ăn nhẹ và uống nhiều nước (tránh đồ ăn nhiều dầu mỡ).</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  const coords = selectedAlert.hospitalLocation?.coordinates;
                  const query = coords ? `${coords[1]},${coords[0]}` : encodeURIComponent(selectedAlert.hospitalAddress || selectedAlert.hospitalName);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <MapPinIcon className="w-4 h-4" />
                Chỉ đường Google Maps
              </button>
              <button 
                onClick={() => {
                  const phone = selectedAlert.hospitalPhone || '02838554137';
                  window.location.href = `tel:${phone}`;
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-green-300 text-green-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                <PhoneIcon className="w-4 h-4 text-green-600" />
                Gọi Bệnh viện
              </button>
            </div>
          </div>
        );

      case 'declined':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700">Đã ghi nhận phản hồi</h3>
            <p className="text-gray-500 mt-2">Phản hồi của bạn đã được ghi nhận vào hệ thống. Xin cảm ơn bạn!</p>
            <button 
              onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
              className="mt-6 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Quay lại danh sách
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-700">Yêu cầu SOS đã hết hạn</h3>
              <p className="text-gray-500 mt-2">
                {selectedAlert.donorResponse === 'accepted'
                  ? 'Bạn đã từng xác nhận sẵn sàng hiến máu cho yêu cầu này.'
                  : selectedAlert.donorResponse === 'declined'
                    ? 'Bạn đã phản hồi không thể tham gia yêu cầu này.'
                    : 'Yêu cầu này đã kết thúc trước khi bạn phản hồi.'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Hạn chót: {format(new Date(selectedAlert.fulfillmentDeadline), 'HH:mm - dd/MM/yyyy')}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
              Mã ưu tiên và hướng dẫn đến bệnh viện không còn hiệu lực.
            </div>
            <button
              onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Quay lại danh sách
            </button>
          </div>
        );

      case 'ineligible':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-yellow-700">Chưa đủ điều kiện hiến máu</h3>
            <p className="text-yellow-600 mt-2">Bạn cần thêm thời gian phục hồi sau lần hiến máu gần nhất.</p>
            <button 
              onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
              className="mt-6 px-6 py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        );

      case 'fulfilled':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-700">Yêu cầu SOS đã hoàn tất</h3>
            <p className="text-green-600 mt-2">Cảm ơn bạn! Yêu cầu hiến máu khẩn cấp này đã tiếp nhận đủ lượng máu cần thiết từ các tình nguyện viên.</p>
            <p className="text-gray-500 mt-1">Sự sẵn sàng của bạn là nguồn động viên rất lớn cho đội ngũ y bác sĩ.</p>
            <button 
              onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
              className="mt-6 px-6 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Quay lại danh sách
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-700">Cảnh báo SOS khẩn cấp</h3>
            <p className="text-red-600 mt-2">Đang cần máu gấp phục vụ cấp cứu</p>
          </div>
        );
    }
  };

  return (
    <>
      <div className="space-y-6">
        {showDetail && selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xl w-full max-w-lg max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Chi tiết phản hồi</h2>
                <button 
                  onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderResponseDetail()}
            </div>
          </div>
        )}

        {selectedAlert && (
          <HospitalMapModal
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            hospitalName={selectedAlert.hospitalName}
            hospitalAddress={selectedAlert.hospitalAddress}
            coordinates={
              selectedAlert.hospitalLocation?.coordinates 
                ? [selectedAlert.hospitalLocation.coordinates[0], selectedAlert.hospitalLocation.coordinates[1]]
                : [106.659616, 10.757826] // Default to Chợ Rẫy
            }
          />
        )}

        {/* Alerts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách cảnh báo khẩn cấp</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600">Không có cảnh báo SOS</h3>
              <p className="text-gray-500 mt-1">Bạn sẽ nhận được thông báo khẩn cấp tại đây khi các bệnh viện cần nhóm máu của bạn.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const isRead = alert.readAt !== null;
                const hasResponded = alert.donorResponse !== null;
                const terminalStatus = getTerminalResponseStatus(alert);
                const isInactive = terminalStatus !== null;

                return (
                  <div
                    key={alert.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer ${
                      !isRead
                        ? 'bg-red-50 border-red-200 border-l-4 border-l-red-600 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleCardClick(alert)}
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Urgency Badge */}
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${getUrgencyColor(alert.urgencyLevel)}`}>
                          {getUrgencyIcon(alert.urgencyLevel)}
                          {getUrgencyLabel(alert.urgencyLevel)}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-base font-semibold ${!isRead ? 'text-red-700' : 'text-gray-900'}`}>
                              Cảnh báo khẩn cấp SOS
                            </h3>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                              🚨 YÊU CẦU SOS KHẨN CẤP
                            </span>
                          </div>

                          <p className="text-gray-600 leading-relaxed">
                            Cần gấp nhóm máu <strong>{alert.bloodType}</strong> tại <strong>{alert.hospitalName}</strong>.
                            Mã bệnh nhân: {alert.patientReference}. Lượng máu cần: {alert.requiredQuantityMl} ml.
                          </p>

                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs text-gray-500 pt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {alert.hospitalAddress}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Hạn chót: {format(new Date(alert.fulfillmentDeadline), 'dd/MM/yyyy HH:mm')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-red-500" />
                              Cần {alert.requiredQuantityMl} ml
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row sm:flex-col flex-wrap items-stretch sm:items-end gap-2 shrink-0">
                        {isInactive ? (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                            {terminalStatus === 'fulfilled'
                              ? 'Đã hoàn tất'
                              : hasResponded ? 'Đã phản hồi · Đã kết thúc' : 'Đã kết thúc'}
                          </span>
                        ) : hasResponded ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                              setResponseStatus(alert.donorResponse || 'accepted');
                              setShowDetail(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-emerald-300"
                            title="Bấm để xem lại hướng dẫn, mã ưu tiên và chỉ đường"
                          >
                            <span>✓ {alert.donorResponse === 'accepted' ? 'Xem hướng dẫn' : 'Đã phản hồi'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPendingResponse({ alert, response: 'accepted' }); }}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Heart className="w-3.5 h-3.5" />
                              Tôi có thể hỗ trợ
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPendingResponse({ alert, response: 'declined' }); }}
                              className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                            >
                              Chưa thể hỗ trợ
                            </button>
                          </>
                        )}
                        {!isRead && !hasResponded && !isInactive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDismiss(alert); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Bỏ qua"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    <ConfirmDialog
      isOpen={Boolean(pendingResponse)}
      title={pendingResponse?.response === 'accepted' ? 'Xác nhận sẵn sàng hiến máu' : 'Xác nhận chưa thể tham gia'}
      message={pendingResponse?.response === 'accepted'
        ? `Bạn xác nhận có thể đến ${pendingResponse.alert.hospitalName} để hỗ trợ ca SOS này? Hệ thống sẽ ghi nhận cam kết của bạn.`
        : 'Bạn xác nhận hiện tại chưa thể tham gia ca SOS này? Bạn vẫn có thể xem các cảnh báo khác.'}
      confirmLabel={pendingResponse?.response === 'accepted' ? 'Tôi xác nhận có thể hỗ trợ' : 'Xác nhận chưa thể tham gia'}
      cancelLabel="Quay lại"
      variant={pendingResponse?.response === 'accepted' ? 'primary' : 'warning'}
      onCancel={() => setPendingResponse(null)}
      onConfirm={() => {
        const pending = pendingResponse;
        setPendingResponse(null);
        if (!pending) return;
        if (pending.response === 'accepted') void handleAccept(pending.alert);
        else void handleDecline(pending.alert);
      }}
    />
    </>
  );
};

export default SOSAlertsPage;
