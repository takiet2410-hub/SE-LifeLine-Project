import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sosApi, type SOSRequest } from '../services/sosApi';
import { SOSStatusBadge } from '../components/SOSStatusBadge';
import { HospitalMapModal } from '../components/HospitalMapModal';
import {
  ArrowLeft,
  Activity,
  AlertCircle,
  MapPin,
  Phone,
  Heart,
  CheckCircle,
  XCircle,
  Droplets,
  HeartHandshake,
  Clock,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { apiService } from '../../../services/apiClient';

export const DonorSOSDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || (user as any)?.userId || '';

  const [request, setRequest] = useState<SOSRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responding, setResponding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [donorNotificationId, setDonorNotificationId] = useState<string>('');

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const requestData = await sosApi.getSOSRequestById(id);
        setRequest(requestData);

        // 1. Check local storage persistence
        const isLocalAccepted =
          localStorage.getItem(`sos_responded_${id}`) === 'accepted' ||
          (currentUserId && localStorage.getItem(`sos_responded_${id}_${currentUserId}`) === 'accepted');

        // 2. Check acceptedDonorIds list from request
        const isDonorInAcceptedList = (requestData.acceptedDonorIds || []).some((dId: any) => {
          const dIdStr = typeof dId === 'object' ? (dId._id || dId.id || dId).toString() : String(dId);
          return (
            (currentUserId && dIdStr === currentUserId) ||
            ((user as any)?.donorProfileId && dIdStr === (user as any).donorProfileId)
          );
        });

        if (isLocalAccepted || isDonorInAcceptedList) {
          setHasResponded(true);
        }

        // 3. Check notifications for this user to get personal notification ID and response status
        try {
          const notifs = await apiService.getNotifications({ type: 'SOS' });
          const matched = (notifs?.data || []).find((n: any) => {
            const sId = n.sourceRefId || n.payload?.sosRequestId || n.payload?.id;
            return String(sId) === String(id);
          });
          if (matched) {
            setDonorNotificationId(matched._id);
            if (matched.payload?.donorResponse === 'accepted') {
              setHasResponded(true);
              localStorage.setItem(`sos_responded_${id}`, 'accepted');
              if (currentUserId) localStorage.setItem(`sos_responded_${id}_${currentUserId}`, 'accepted');
            }
          }
        } catch (err) {
          console.warn('[DonorSOSDetailPage] Failed to check SOS notification status:', err);
        }
      } catch (error: any) {
        console.error('Failed to fetch SOS request:', error);
        toast.error(error?.response?.data?.message || 'Không tìm thấy yêu cầu SOS này.');
        navigate('/sos-alerts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequest();
  }, [id, navigate, currentUserId, user]);

  const handleRespond = async (accept: boolean) => {
    if (!id) return;
    setResponding(true);
    try {
      if (donorNotificationId) {
        try {
          await apiService.respondToSOS(donorNotificationId, accept ? 'accepted' : 'declined');
        } catch {}
      }
      await sosApi.respondToSOS(id, accept);
      if (accept) {
        toast.success('Cảm ơn bạn đã đồng ý hiến máu! Phản hồi ưu tiên của bạn đã được ghi nhận.');
        setHasResponded(true);
        setShowSuccessModal(true);
        localStorage.setItem(`sos_responded_${id}`, 'accepted');
        if (currentUserId) {
          localStorage.setItem(`sos_responded_${id}_${currentUserId}`, 'accepted');
        }
      } else {
        toast.info('Bạn đã từ chối yêu cầu này.');
        localStorage.setItem(`sos_responded_${id}`, 'declined');
        if (currentUserId) {
          localStorage.setItem(`sos_responded_${id}_${currentUserId}`, 'declined');
        }
        navigate('/sos-alerts');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setResponding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Đang tải thông tin yêu cầu...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="text-slate-500">Không tìm thấy yêu cầu SOS.</p>
        <button
          onClick={() => navigate('/sos-alerts')}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
        >
          Quay lại Cảnh báo SOS
        </button>
      </div>
    );
  }

  const hospitalData: any = request.hospital || request.hospitalId;
  const isActive = !['Fulfilled', 'Expired', 'Cancelled'].includes(request.status);
  const donorUniqueRef = donorNotificationId || currentUserId || request.id || (request as any)._id || id || '';
  const fastTrackCode = `SOS-${donorUniqueRef.slice(-6).toUpperCase()}`;

  const coords = hospitalData?.location?.coordinates;
  const googleMapUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospitalData?.address || hospitalData?.name || '')}`;
  const hospitalPhone = hospitalData?.contactPhone || '02838554137';

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 py-6 px-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            🚨 Yêu cầu Máu Khẩn Cấp
          </h1>
          <p className="text-sm text-slate-500">Nhóm máu của bạn có thể cứu sống một bệnh nhân</p>
        </div>
      </div>

      {/* Urgency Banner */}
      <div className={`rounded-2xl p-5 border-2 ${
        request.urgencyLevel === 'Critical'
          ? 'bg-red-50 border-red-200'
          : request.urgencyLevel === 'High'
          ? 'bg-orange-50 border-orange-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-red-300 flex items-center justify-center shadow-xs">
              <span className="text-2xl font-black text-red-700">{request.bloodType}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cần gấp nhóm máu</p>
              <p className="text-3xl font-black text-slate-900">{request.bloodType}</p>
              <p className="text-sm text-slate-600">{request.requiredQuantityMl} ml cần thiết</p>
            </div>
          </div>
          <div className="text-right">
            <SOSStatusBadge urgency={request.urgencyLevel} />
            <p className="text-xs text-slate-500 mt-1">
              Hạn chót: {format(new Date(request.fulfillmentDeadline), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>
      </div>

      {/* Hospital Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-600" />
          Thông tin Bệnh viện
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Tên bệnh viện</p>
            <p className="font-semibold text-slate-900">{hospitalData?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Địa chỉ</p>
            <p className="text-slate-700">{hospitalData?.address || 'N/A'}</p>
          </div>
          {request.patientReference && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Mã bệnh nhân</p>
              <p className="text-slate-700 font-mono">{request.patientReference}</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          {hospitalData?.location && (
            <button
              onClick={() => setIsMapOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 text-sm font-semibold transition cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              Xem bản đồ
            </button>
          )}
          {hospitalData?.contactPhone && (
            <a
              href={`tel:${hospitalData.contactPhone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl border border-green-200 text-sm font-semibold transition"
            >
              <Phone className="w-4 h-4" />
              Gọi BV
            </a>
          )}
        </div>
      </div>

      {/* Response Section */}
      {hasResponded ? (
        <div className="bg-green-50/80 rounded-2xl border border-green-200 p-6 space-y-4 shadow-xs">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-green-800 text-lg">Cảm Ơn Bạn Đã Sẵn Sàng Cứu Người!</h3>
            <p className="text-green-700 text-sm">
              Bạn đã cam kết tham gia hiến máu khẩn cấp cho ca SOS này.
            </p>
            <div className="inline-block p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium text-left">
              ℹ️ Đây là cam kết hỗ trợ khẩn cấp. Điểm thưởng và huy hiệu sẽ được ghi nhận sau khi bệnh viện hoàn tất tiếp nhận máu.
            </div>
          </div>

          {/* Fast Track Code Card */}
          <div className="p-4 bg-white rounded-xl border border-green-200 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Mã tiếp nhận ưu tiên cấp cứu
              </span>
              <p className="text-2xl font-black text-red-600 font-mono tracking-wide">{fastTrackCode}</p>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg shrink-0">
              Ưu tiên số 1
            </span>
          </div>

          {/* Directions & Checklist */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-green-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              Hướng dẫn di chuyển & Điểm đến
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <p><strong>Bệnh viện:</strong> {hospitalData?.name}</p>
              <p><strong>Địa chỉ:</strong> {hospitalData?.address}</p>
              <p><strong>Thời gian đến trước:</strong> <span className="text-red-700 font-bold">{format(new Date(request.fulfillmentDeadline), 'HH:mm - dd/MM/yyyy')}</span></p>
            </div>

            {/* Checklist */}
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/70 text-xs text-amber-900 space-y-1 mt-2">
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

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => window.open(googleMapUrl, '_blank')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Chỉ đường Google Maps
            </button>
            <a
              href={`tel:${hospitalPhone}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-green-300 text-green-800 rounded-xl font-bold text-xs transition text-center"
            >
              <Phone className="w-4 h-4 text-green-600" />
              Gọi Bệnh viện
            </a>
          </div>

          <div className="text-center pt-1">
            <button
              onClick={() => setShowSuccessModal(true)}
              className="text-xs font-semibold text-green-700 hover:text-green-800 underline cursor-pointer"
            >
              Mở lại cửa sổ popup mã tiếp nhận
            </button>
          </div>
        </div>
      ) : isActive ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-600" />
            Bạn có thể giúp đỡ không?
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Nhóm máu <strong className="text-red-700">{request.bloodType}</strong> của bạn tương thích với yêu cầu này.
            Mỗi đơn vị máu của bạn có thể cứu sống bệnh nhân đang cần gấp.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRespond(true)}
              disabled={responding}
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
            >
              <Droplets className="w-5 h-5" />
              {responding ? 'Đang xử lý...' : 'Tôi sẽ hiến máu'}
            </button>
            <button
              onClick={() => handleRespond(false)}
              disabled={responding}
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
              Không thể tham gia
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Bạn có thể thay đổi quyết định bất kỳ lúc nào bằng cách liên hệ bệnh viện.
          </p>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-slate-500 text-sm">Yêu cầu này đã kết thúc ({request.status}).</p>
        </div>
      )}

      {/* Hospital Map Modal */}
      {hospitalData?.location && (
        <HospitalMapModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          hospitalName={hospitalData.name}
          hospitalAddress={hospitalData.address}
          coordinates={hospitalData.location.coordinates}
        />
      )}

      {/* Success Modal with Fast Track Code */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cảm Ơn Bạn Đã Sẵn Sàng!</h3>
                  <p className="text-xs text-white/80">Phản hồi hiến máu cấp cứu đã được xác nhận</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Fast Track Code */}
              <div className="p-4 bg-red-50/80 rounded-2xl border border-red-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Mã tiếp nhận ưu tiên cấp cứu
                  </span>
                  <p className="text-2xl font-black text-red-600 font-mono tracking-wide mt-0.5">
                    {fastTrackCode}
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-red-600 text-white text-xs font-extrabold rounded-lg shadow-xs">
                  Ưu tiên số 1
                </span>
              </div>

              {/* Destination & Timing */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Hướng dẫn & Điểm đến
                </h4>
                <div className="space-y-1.5 pt-1">
                  <p><strong className="text-slate-900">Bệnh viện:</strong> {hospitalData?.name}</p>
                  <p><strong className="text-slate-900">Địa chỉ:</strong> {hospitalData?.address}</p>
                  <p className="flex items-center gap-1 text-slate-900">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <strong>Thời gian đến trước:</strong>
                    <span className="text-red-700 font-bold ml-1">
                      {format(new Date(request.fulfillmentDeadline), 'HH:mm - dd/MM/yyyy')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  Lưu ý chuẩn bị trước khi đến viện:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90 pl-1">
                  <li>Mang theo CCCD gắn chip hoặc ứng dụng VNeID đã kích hoạt.</li>
                  <li>Không sử dụng rượu, bia hoặc chất kích thích trong vòng 24h.</li>
                  <li>Nên ăn nhẹ và uống nhiều nước (tránh thức ăn có quá nhiều dầu mỡ).</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <div className="flex gap-2">
                <a
                  href={`tel:${hospitalPhone}`}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-green-300 text-green-800 text-xs font-bold hover:bg-green-50 transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                  Gọi BV
                </a>
                <button
                  onClick={() => window.open(googleMapUrl, '_blank')}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Chỉ đường Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

