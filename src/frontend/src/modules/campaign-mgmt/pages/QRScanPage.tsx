import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, XCircle, RefreshCw, QrCode, Search, UploadCloud, FileImage, ShieldCheck, User, CreditCard, Droplet } from 'lucide-react';
import { toast } from 'sonner';
import jsQR from 'jsqr';
import { apiService } from '../../../services/apiClient';

export const QRScanPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    id: string;
    name: string;
    status: string;
    idCard?: string;
    bloodType?: string;
    phone?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessScan = async (codeToProcess?: string) => {
    const targetCode = (codeToProcess !== undefined ? codeToProcess : manualCode).trim();
    if (!targetCode) {
      toast.error('Vui lòng nhập mã hoặc tải lên ảnh QR!');
      return;
    }

    setScanState('scanning');
    setErrorMessage(null);

    try {
      const res = await apiService.checkInQRCode(targetCode, campaignId);
      if (res) {
        const currentStatus = res.status || 'CheckedIn';
        const regId = res.registrationId || res._id || targetCode;
        const donorName = res.donorName || (res.donor ? res.donor.fullName : 'Người hiến máu');
        const donorIdCard = res.donorIdCard || (res.donor ? res.donor.idDocumentNumber : '');
        const donorBloodType = res.donorBloodType || (res.donor ? res.donor.bloodType : '');
        const donorPhone = res.donorPhone || (res.donor ? res.donor.phoneNumber : '');

        // If campaign is not active yet (Upcoming/Draft)
        if (res.isCampaignNotActive || res.warning) {
          setScanState('error');
          const warningMsg = res.warning || 'Chiến dịch chưa diễn ra (chưa mở).';
          setErrorMessage(warningMsg);
          toast.error(warningMsg);
          // Show donor profile below because it is the correct campaign
          setScannedResult({
            id: regId,
            name: donorName,
            status: currentStatus,
            idCard: donorIdCard,
            bloodType: donorBloodType,
            phone: donorPhone,
          });
          return;
        }

        if (currentStatus === 'Cancelled' || currentStatus === 'Rejected') {
          setScanState('error');
          const msg = currentStatus === 'Cancelled' ? 'Phiếu đăng ký đã bị hủy' : 'Phiếu đăng ký đã bị từ chối';
          setErrorMessage(msg);
          toast.error(msg);
          setScannedResult({
            id: regId,
            name: donorName,
            status: currentStatus,
            idCard: donorIdCard,
            bloodType: donorBloodType,
            phone: donorPhone,
          });
          return;
        }

        setScannedResult({
          id: regId,
          name: donorName,
          status: currentStatus,
          idCard: donorIdCard,
          bloodType: donorBloodType,
          phone: donorPhone,
        });
        setScanState('success');
        if (currentStatus === 'CheckedIn') {
          toast.success(`Đã điểm danh cho ${donorName}!`);
        } else {
          toast.info(`Trạng thái phiếu: ${currentStatus}`);
        }
      } else {
        setScanState('error');
        setScannedResult(null);
        setErrorMessage('Không tìm thấy phiếu đăng ký / vé.');
        toast.error('Không tìm thấy phiếu đăng ký!');
      }
    } catch (err: any) {
      setScanState('error');
      // For tickets of other campaigns or invalid tickets: DO NOT show any donor profile
      setScannedResult(null);
      const msg = err?.response?.data?.message || err?.message || 'Mã QR không hợp lệ.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  // Process QR Code Image Upload using jsQR
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code && code.data) {
            toast.info(`Đã quét & giải mã QR từ ảnh thành công!`);
            setManualCode(code.data);
            handleProcessScan(code.data);
          } else {
            setScanState('error');
            setErrorMessage('Không tìm thấy mã QR hợp lệ trong hình ảnh đã chọn. Vui lòng tải ảnh rõ nét hơn hoặc nhập thủ công.');
            toast.error('Không tìm thấy mã QR trong hình ảnh!');
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input value to allow re-uploading the same file if needed
    event.target.value = '';
  };

  const handleResetScan = () => {
    setScanState('idle');
    setScannedResult(null);
    setErrorMessage(null);
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/bc/campaigns/${campaignId || 'all'}/registrations`)}
          className="h-10 px-3.5 rounded-xl bg-white border border-[#f1f3f5] text-[#6c757d] hover:text-[#271816] hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2 text-sm font-semibold shadow-2xs"
          title="Quay lại danh sách đăng ký"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Danh Sách Đăng Ký</span>
        </button>

        {scanState !== 'idle' && (
          <button
            onClick={handleResetScan}
            className="h-10 px-4 text-[13px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Quét Mã Khác</span>
          </button>
        )}
      </div>

      {/* Main Grid: Input Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Method 1: Manual Input (Nhập Thủ Công) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2 text-[#93000b]">
              <div className="p-2 bg-red-50 rounded-xl">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900">1. Nhập Số CCCD Hoặc Mã E-Ticket</h3>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
              Nhập 12 số Căn cước công dân (CCCD) hoặc Mã vé E-Ticket (ví dụ: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">TK-...</code>) để điểm danh nhanh.
            </p>

            <div className="relative">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Nhập số CCCD (12 số) hoặc Mã E-Ticket (TK-...)..."
                className="w-full pl-3.5 pr-10 py-3 text-[13px] border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium text-slate-900 bg-slate-50/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProcessScan();
                }}
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => handleProcessScan()}
            disabled={scanState === 'scanning'}
            className="w-full py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {scanState === 'scanning' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang Điểm Danh...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Xác Thực & Điểm Danh</span>
              </>
            )}
          </button>
        </div>

        {/* Method 2: Upload QR Image File (Tải Ảnh QR) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2 text-[#93000b]">
              <div className="p-2 bg-red-50 rounded-xl">
                <FileImage className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900">2. Tải Lên Ảnh Mã QR E-Ticket</h3>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
              Tải lên hình ảnh E-Ticket QR lưu trong máy hoặc ảnh chụp từ màn hình điện thoại tình nguyện viên.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="qr-file-input"
            />

            <label
              htmlFor="qr-file-input"
              className="border-2 border-dashed border-red-200 hover:border-[#93000b] bg-[#fff8f7]/60 hover:bg-[#fff0ee] rounded-xl py-7 px-5 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
            >
              <UploadCloud className="w-9 h-9 text-[#93000b] mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-bold text-slate-800 group-hover:text-[#93000b]">
                Bấm vào đây để tải lên ảnh mã QR
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Hỗ trợ định dạng PNG, JPG, JPEG, WebP
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Camera Viewport Simulation Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Camera className="w-5 h-5 text-[#93000b]" />
            <h3 className="text-[15px] font-bold">Quét Mã QR Trực Tiếp Bằng Camera</h3>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            ● Camera Sẵn Sàng
          </span>
        </div>

        <div className="relative w-full max-w-md mx-auto aspect-video md:aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center overflow-hidden border-4 border-slate-800 shadow-inner">
          {scanState === 'idle' && (
            <div className="text-center p-6 space-y-3">
              <Camera className="w-12 h-12 text-slate-400 mx-auto animate-bounce opacity-80" />
              <p className="text-sm font-medium text-slate-300 max-w-xs">
                Đưa mã QR E-Ticket của người hiến vào trung tâm khung hình bên dưới.
              </p>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="space-y-3">
              <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-white">Đang giải mã QR & cập nhật trạng thái CheckedIn...</p>
            </div>
          )}

          {scanState === 'success' && scannedResult && (
            <div className="bg-emerald-600 text-white p-6 rounded-2xl space-y-3 max-w-xs animate-in zoom-in-95 shadow-xl text-center">
              <CheckCircle2 className="w-14 h-14 mx-auto text-white" />
              <div>
                <h4 className="font-extrabold text-lg">Xác Thực Mã QR Thành Công!</h4>
                <p className="text-[12px] opacity-90 uppercase tracking-wider font-semibold">Trạng thái: {scannedResult.status}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl text-left text-xs space-y-1 border border-white/20">
                <p className="font-bold flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {scannedResult.name}</p>
                {scannedResult.idCard && <p className="opacity-90 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> CCCD: {scannedResult.idCard}</p>}
                {scannedResult.bloodType && <p className="opacity-90 flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5" /> Nhóm máu: {scannedResult.bloodType}</p>}
              </div>
            </div>
          )}

          {scanState === 'error' && (
            <div className="bg-rose-600 text-white p-5 rounded-2xl space-y-2 max-w-xs animate-in zoom-in-95 shadow-xl text-center">
              <XCircle className="w-10 h-10 mx-auto text-white" />
              <h4 className="font-bold text-base">Quét Thất Bại</h4>
              <p className="text-xs opacity-95 leading-relaxed font-medium">{errorMessage || 'Mã QR không tồn tại trong hệ thống hoặc không đúng định dạng.'}</p>
              {scannedResult && (
                <div className="p-2.5 bg-white/10 rounded-xl text-left text-xs space-y-1 border border-white/20 mt-2">
                  <p className="font-bold flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {scannedResult.name}</p>
                  {scannedResult.idCard && <p className="opacity-90 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> CCCD: {scannedResult.idCard}</p>}
                  {scannedResult.bloodType && <p className="opacity-90 flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5" /> Nhóm máu: {scannedResult.bloodType}</p>}
                  <p className="opacity-90 font-semibold mt-0.5 text-amber-200">Trạng thái phiếu: {scannedResult.status}</p>
                </div>
              )}
            </div>
          )}

          {/* Scanner Guide Frame Overlay */}
          <div className="absolute inset-10 border-2 border-dashed border-red-500/70 rounded-2xl pointer-events-none" />
        </div>

        {/* Action Button When Scanned Record Exists */}
        {scannedResult && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={() =>
                navigate(`/bc/campaigns/${campaignId || 'all'}/registrations/${scannedResult.id}`)
              }
              className="px-6 py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-[14px] font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Mở Hồ Sơ Đăng Ký ({scannedResult.name}) →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
