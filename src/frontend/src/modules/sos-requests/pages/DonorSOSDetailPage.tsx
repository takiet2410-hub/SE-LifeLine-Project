import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sosApi, type SOSRequest } from '../services/sosApi';
import { SOSStatusBadge } from '../components/SOSStatusBadge';
import { HospitalMapModal } from '../components/HospitalMapModal';
import { ArrowLeft, Activity, AlertCircle, MapPin, Phone, Heart, CheckCircle, XCircle, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const DonorSOSDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<SOSRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const requestData = await sosApi.getSOSRequestById(id);
        setRequest(requestData);
      } catch (error: any) {
        console.error('Failed to fetch SOS request:', error);
        toast.error('Không tìm thấy yêu cầu SOS này.');
        navigate('/donor/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequest();
  }, [id, navigate]);

  const handleRespond = async (accept: boolean) => {
    if (!id) return;
    setResponding(true);
    try {
      await sosApi.respondToSOS(id, accept);
      if (accept) {
        toast.success('Cảm ơn bạn đã đồng ý hiến máu! Bệnh viện sẽ liên hệ với bạn sớm nhất.');
        setHasResponded(true);
      } else {
        toast.info('Bạn đã từ chối yêu cầu này.');
        navigate('/donor/dashboard');
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
          onClick={() => navigate('/donor/dashboard')}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  const hospitalData: any = request.hospital || request.hospitalId;
  const isActive = !['Fulfilled', 'Expired', 'Cancelled'].includes(request.status);

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 py-6 px-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">🚨 Yêu cầu Máu Khẩn Cấp</h1>
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
            <div className="w-16 h-16 rounded-full bg-white border-2 border-red-300 flex items-center justify-center">
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
            <p className="text-xs text-slate-500 mt-1">Hạn chót: {format(new Date(request.fulfillmentDeadline), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>
      </div>

      {/* Hospital Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 text-sm font-semibold transition"
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
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <h3 className="font-bold text-green-800 text-lg">Cảm ơn bạn!</h3>
          <p className="text-green-700 text-sm">
            Bạn đã đồng ý tham gia hiến máu khẩn cấp. Đội ngũ bệnh viện sẽ liên hệ với bạn qua số điện thoại đăng ký.
          </p>
          <p className="text-xs text-green-600 font-medium">
            Vui lòng giữ điện thoại và đến bệnh viện theo hướng dẫn.
          </p>
        </div>
      ) : isActive ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
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
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl font-bold transition shadow-sm"
            >
              <Droplets className="w-5 h-5" />
              {responding ? 'Đang xử lý...' : 'Tôi sẽ hiến máu'}
            </button>
            <button
              onClick={() => handleRespond(false)}
              disabled={responding}
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 rounded-xl font-semibold transition"
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

      {/* Map Modal */}
      {hospitalData?.location && (
        <HospitalMapModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          hospitalName={hospitalData.name}
          hospitalAddress={hospitalData.address}
          coordinates={hospitalData.location.coordinates}
        />
      )}
    </div>
  );
};
