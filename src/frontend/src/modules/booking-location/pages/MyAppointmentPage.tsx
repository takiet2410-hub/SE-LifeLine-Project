import React, { useState, useEffect } from 'react';
import { AppointmentTabs } from '../components/AppointmentTabs';
import { AppointmentListItem } from '../components/AppointmentListItem';
import { AppointmentDetails } from '../components/AppointmentDetails';
import { CancelAppointmentModal } from '../components/CancelAppointmentModal';
import { DownloadToast } from '../components/DownloadToast';
import { ETicketModal } from '../components/ETicketModal';
import { fetchAppointments, cancelAppointment, downloadETicket } from '../api/bookingApi';
import type { Appointment, AppointmentStatus } from '../types';
import { CalendarX2, Loader2, FileText, Plus, HeartHandshake, Sparkles, CalendarPlus, ArrowRight, Clock, MapPin, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const MyAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AppointmentStatus>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Toast States
  const [cancelModalData, setCancelModalData] = useState<{ isOpen: boolean; appointmentId: string | null; isProcessing: boolean; error: string | null }>({
    isOpen: false,
    appointmentId: null,
    isProcessing: false,
    error: null
  });
  
  const [toastData, setToastData] = useState<{ isVisible: boolean; message: string }>({
    isVisible: false,
    message: ''
  });

  const [isETicketModalOpen, setIsETicketModalOpen] = useState(false);

  useEffect(() => {
    loadAppointments(true);

    // Auto-poll status every 5 seconds to automatically detect BloodCenter approval
    const pollInterval = setInterval(() => {
      loadAppointments(false);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const loadAppointments = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAppointments();
      if (res.success && res.data) {
        setAppointments(res.data);
        // Default select first item if not set
        if (!selectedId) {
          const upcomings = res.data.filter(a => a.status === 'upcoming' || a.status === 'pending');
          if (upcomings.length > 0) {
            setSelectedId(upcomings[0].id);
          } else if (res.data.length > 0) {
            setSelectedId(res.data[0].id);
          }
        }
      } else {
        if (showLoading) setError(res.message || 'Failed to load appointments');
      }
    } catch (err) {
      if (showLoading) setError('System error occurred.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const filteredAppointments = activeTab === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.status === activeTab);
  const selectedAppointment = appointments.find(apt => apt.id === selectedId);

  // When tab changes, try to auto-select the first item in the new tab
  useEffect(() => {
    if (filteredAppointments.length > 0) {
      if (!filteredAppointments.some(a => a.id === selectedId)) {
        setSelectedId(filteredAppointments[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [activeTab, filteredAppointments, selectedId]);

  // Cancel Flow
  const handleOpenCancelModal = (id: string) => {
    setCancelModalData({ isOpen: true, appointmentId: id, isProcessing: false, error: null });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalData.appointmentId) return;

    setCancelModalData(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const res = await cancelAppointment(cancelModalData.appointmentId);
      if (res.success) {
        setAppointments(prev => prev.map(apt => 
          apt.id === cancelModalData.appointmentId 
            ? { ...apt, status: 'cancelled' } 
            : apt
        ));
        setCancelModalData({ isOpen: false, appointmentId: null, isProcessing: false, error: null });
        setToastData({ isVisible: true, message: 'Appointment cancelled successfully' });
      } else {
        setCancelModalData(prev => ({ ...prev, isProcessing: false, error: res.message || 'Cancellation failed' }));
      }
    } catch (err) {
      setCancelModalData(prev => ({ ...prev, isProcessing: false, error: 'Network error' }));
    }
  };

  // Helper to force browser file download
  const triggerDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback to direct link download if fetch blob is blocked
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Download Flow
  const handleDownload = async (id: string) => {
    try {
      const res = await downloadETicket(id);
      if (res.success) {
        const toastId = toast.loading('Đang khởi tạo Thẻ Hẹn Hiến Máu (E-Ticket Pass)...');
        
        // Find appointment details
        const apt = appointments.find(a => a.id === id);
        
        // Retrieve donor user info from localStorage if available
        let donorName = 'Người hiến máu LifeLine';
        try {
          const rawUser = localStorage.getItem('user');
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            donorName = parsed.fullName || parsed.name || donorName;
          }
        } catch (e) {}

        const ticketCode = res.data?.ticketCode || `TK-${id.slice(-6).toUpperCase()}`;
        const qrCodeUrl = res.data?.fileUrl || apt?.qrCodeUrl;

        try {
          const { generateETicketPassImage } = await import('../utils/eTicketGenerator');
          const passBlob = await generateETicketPassImage({
            ticketCode,
            donorName,
            bloodType: apt?.bloodType,
            campaignName: apt?.location.name || 'Chiến Dịch Hiến Máu Nhân Đạo LifeLine',
            locationAddress: apt?.location.address,
            date: apt?.date || new Date().toLocaleDateString('vi-VN'),
            timeSlot: apt?.time || '08:00 - 11:30',
            qrCodeUrl
          });

          const blobUrl = URL.createObjectURL(passBlob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `ETicket-Pass-${ticketCode}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);

          toast.dismiss(toastId);
          toast.success('Tải thành công Thẻ Hẹn Hiến Máu về máy!');
        } catch (genErr) {
          console.error('Error generating pass image:', genErr);
          toast.dismiss(toastId);
          if (res.data && res.data.fileUrl) {
            await triggerDownload(res.data.fileUrl, `ETicket-${ticketCode}.png`);
          } else {
            toast.info('Bạn có thể đưa trực tiếp mã QR trên màn hình cho nhân viên y tế.');
          }
        }
      } else {
        toast.error(res.message || 'Không thể tải E-Ticket');
      }
    } catch (err) {
      toast.error('Lỗi kết nối, vui lòng thử lại');
    }
  };

  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  const handleSync = async (id: string) => {
    try {
      setIsSyncing(prev => ({ ...prev, [id]: true }));
      const { syncAppointmentToBloodCenter } = await import('../api/bookingApi');
      const res = await syncAppointmentToBloodCenter(id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Lỗi kết nối khi đồng bộ');
    } finally {
      setIsSyncing(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="flex flex-col h-full relative p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      <AppointmentTabs activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Main Content: Master-Detail Layout or Full Schedule Empty State */}
      {!isLoading && appointments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 bg-gradient-to-b from-[#fff8f7] via-white to-[#fdfbfb] border border-[#f1f3f5] rounded-3xl shadow-xs my-auto text-center">
          <div className="w-20 h-20 bg-red-100/80 rounded-3xl flex items-center justify-center mb-6 shadow-inner relative group">
            <div className="absolute inset-0 bg-red-400/20 rounded-3xl animate-ping opacity-60" />
            <HeartHandshake className="w-10 h-10 text-[#93000b] relative z-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#93000b] rounded-full text-[12px] font-bold mb-3 border border-red-100 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hành Trình Trao Giọt Máu Hồng</span>
          </div>

          <h2 className="text-[26px] md:text-[30px] font-extrabold text-[#271816] tracking-tight max-w-xl mb-3">
            Bạn Chưa Có Lịch Hẹn Hiến Máu Nào
          </h2>

          <p className="text-[14px] md:text-[15px] text-[#6c757d] text-center max-w-lg mb-8 leading-relaxed">
            Mỗi giọt máu cho đi trao thêm cơ hội sống cho 3 người bệnh. Hãy đặt lịch hẹn ngay hôm nay để nhận thẻ E-Ticket QR đón tiếp ưu tiên và tích lũy huy hiệu người hiến máu!
          </p>

          <button
            onClick={() => navigate('/my-appointments/schedule')}
            className="px-8 py-3.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[15px] font-bold rounded-2xl flex items-center gap-3 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <CalendarPlus className="w-5 h-5 text-white" />
            <span>Đặt Lịch Hiến Máu Ngay</span>
            <ArrowRight className="w-5 h-5 text-white/80 ml-1" />
          </button>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 w-full max-w-3xl">
            <div className="p-5 bg-white border border-[#f1f3f5] rounded-2xl flex flex-col items-center text-center shadow-2xs hover:shadow-xs transition-all">
              <div className="p-3 bg-red-50 text-[#93000b] rounded-xl mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-[14px] font-bold text-[#271816] mb-1">Đón Tiếp Ưu Tiên</h4>
              <p className="text-[12px] text-[#6c757d] leading-relaxed">Điểm danh & sàng lọc nhanh bằng Thẻ Hẹn E-Ticket QR, tiết kiệm thời gian chờ đợi.</p>
            </div>

            <div className="p-5 bg-white border border-[#f1f3f5] rounded-2xl flex flex-col items-center text-center shadow-2xs hover:shadow-xs transition-all">
              <div className="p-3 bg-red-50 text-[#93000b] rounded-xl mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-[14px] font-bold text-[#271816] mb-1">Điểm Hiến Linh Hoạt</h4>
              <p className="text-[12px] text-[#6c757d] leading-relaxed">Lựa chọn Bệnh viện Chợ Rẫy, Truyền Máu Huyết Học, Từ Dũ hoặc đợt lưu động gần bạn.</p>
            </div>

            <div className="p-5 bg-white border border-[#f1f3f5] rounded-2xl flex flex-col items-center text-center shadow-2xs hover:shadow-xs transition-all">
              <div className="p-3 bg-red-50 text-[#93000b] rounded-xl mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-[14px] font-bold text-[#271816] mb-1">Tích Lũy Điểm & XP</h4>
              <p className="text-[12px] text-[#6c757d] leading-relaxed">Theo dõi nhật ký hiến máu, nâng hạng level người hiến máu và mở khóa huy hiệu tôn vinh.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Left Column: List View */}
          <div className="w-full md:w-[380px] shrink-0 flex flex-col overflow-y-auto pr-2 gap-3 pb-6 md:pb-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-[#93000b] animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-[14px] font-medium text-[#93000b]">{error}</span>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-[#f1f3f5] rounded-2xl shadow-2xs">
                <CalendarX2 className="w-10 h-10 text-[#a3a3a3] mb-3" />
                <p className="text-[14px] font-bold text-[#271816] mb-1">Không có lịch hẹn nào</p>
                <p className="text-[12px] text-[#6c757d] mb-4">Không tìm thấy lịch hẹn cho mục {activeTab}.</p>
                <button
                  onClick={() => navigate('/my-appointments/schedule')}
                  className="px-4 py-2 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-bold rounded-xl flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đặt lịch hiến máu mới</span>
                </button>
              </div>
            ) : (
              <>
                {filteredAppointments.map(apt => (
                  <AppointmentListItem
                    key={apt.id}
                    appointment={apt}
                    isSelected={selectedId === apt.id}
                    onClick={setSelectedId}
                  />
                ))}
                
                {/* Schedule Another Button Box */}
                <div className="mt-4 p-5 bg-[#fff8f7] border border-[#f1f3f5] rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                  <p className="text-[13px] font-medium text-[#5b403d] mb-3">
                    Muốn đăng ký thêm đợt hiến mới hoặc địa điểm khác?
                  </p>
                  <button
                    onClick={() => navigate('/my-appointments/schedule')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-semibold rounded-lg transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Đặt lịch hẹn mới</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Detail View */}
          <div className="flex-1 min-w-0 bg-transparent flex flex-col pb-6 md:pb-0">
            {!isLoading && selectedAppointment ? (
              <AppointmentDetails 
                appointment={selectedAppointment}
                onCancel={handleOpenCancelModal}
                onDownload={handleDownload}
                onSync={handleSync}
                onViewETicket={() => setIsETicketModalOpen(true)}
                isCancelling={cancelModalData.isProcessing && cancelModalData.appointmentId === selectedAppointment.id}
                isSyncing={isSyncing[selectedAppointment.id]}
              />
            ) : (
              <div className="h-full border border-dashed border-[#dee2e6] rounded-xl flex flex-col items-center justify-center bg-white/50 text-[#a3a3a3] p-6 text-center">
                <FileText className="w-12 h-12 mb-3 opacity-50 text-[#93000b]" />
                <p className="text-[14px] font-semibold text-[#271816] mb-1">Chọn một lịch hẹn để xem chi tiết</p>
                <p className="text-[12px] text-[#6c757d]">Thông tin địa điểm, mã vé E-Ticket và trạng thái xác nhận sẽ hiển thị tại đây.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlays */}
      <ETicketModal
        isOpen={isETicketModalOpen}
        onClose={() => setIsETicketModalOpen(false)}
        appointment={selectedAppointment || null}
        onDownload={handleDownload}
      />

      <CancelAppointmentModal
        isOpen={cancelModalData.isOpen}
        onClose={() => setCancelModalData(prev => ({ ...prev, isOpen: false, error: null }))}
        onConfirm={handleConfirmCancel}
        isProcessing={cancelModalData.isProcessing}
        error={cancelModalData.error}
      />

      <DownloadToast
        isVisible={toastData.isVisible}
        message={toastData.message}
        onClose={() => setToastData(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};
