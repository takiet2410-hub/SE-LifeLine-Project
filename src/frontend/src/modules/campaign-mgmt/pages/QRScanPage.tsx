import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const QRScanPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scannedResult, setScannedResult] = useState<{ id: string; name: string } | null>(null);

  const simulateScanSuccess = () => {
    setScanState('scanning');
    setTimeout(() => {
      setScanState('success');
      setScannedResult({ id: 'reg-001', name: 'Trần Văn Minh' });
      toast.success('Xác thực mã QR thành công!');
    }, 1200);
  };

  const simulateScanError = () => {
    setScanState('scanning');
    setTimeout(() => {
      setScanState('error');
      toast.error('Mã QR không hợp lệ hoặc đã hết hạn!');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/bc/campaigns/${campaignId}/registrations`)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quét Mã QR Phiếu Đăng Ký</h2>
          <p className="text-xs text-slate-500">Xác thực e-Ticket hiến máu của tình nguyện viên</p>
        </div>
      </div>

      {/* Camera Viewport Simulation Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-center space-y-6">
        <div className="relative w-full max-w-sm mx-auto aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center overflow-hidden border-4 border-slate-800 shadow-inner">
          {scanState === 'idle' && (
            <div className="text-center p-6 space-y-3">
              <Camera className="w-12 h-12 text-slate-400 mx-auto animate-bounce" />
              <p className="text-sm font-medium text-slate-300">
                Sẵn sàng quét. Đưa mã QR vào khung hình bên dưới.
              </p>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="space-y-3">
              <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-white">Đang giải mã QR & xác thực chữ ký...</p>
            </div>
          )}

          {scanState === 'success' && scannedResult && (
            <div className="bg-emerald-600 text-white p-6 rounded-xl space-y-2 max-w-xs animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 mx-auto text-white" />
              <h4 className="font-bold text-base">Xác Thực Thành Công!</h4>
              <p className="text-xs opacity-90">{scannedResult.name}</p>
              <p className="text-[11px] font-mono opacity-80">Mã: {scannedResult.id}</p>
            </div>
          )}

          {scanState === 'error' && (
            <div className="bg-rose-600 text-white p-6 rounded-xl space-y-2 max-w-xs animate-in zoom-in-95">
              <XCircle className="w-12 h-12 mx-auto text-white" />
              <h4 className="font-bold text-base">Mã QR Không Hợp Lệ!</h4>
              <p className="text-xs opacity-90">Vé không tồn tại trong chiến dịch này hoặc sai chữ ký số.</p>
            </div>
          )}

          {/* Scanner Guide Frame Overlay */}
          <div className="absolute inset-8 border-2 border-dashed border-red-500/60 rounded-xl pointer-events-none" />
        </div>

        {/* Interactive Simulation Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={simulateScanSuccess}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Quét thử (Thành công)
          </button>
          <button
            onClick={simulateScanError}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Quét thử (Lỗi)
          </button>
          {scanState === 'success' && scannedResult && (
            <button
              onClick={() =>
                navigate(`/bc/campaigns/${campaignId}/registrations/${scannedResult.id}`)
              }
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Mở hồ sơ sàng lọc ngay →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
