import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Award, Printer, X, Heart, ShieldCheck, Droplet, Sparkles } from 'lucide-react';
import { formatDateToDDMMYYYY } from '../../booking-location/api/bookingApi';

export interface CertificateData {
  donorName: string;
  idDocumentNumber?: string;
  dateOfBirth?: string;
  bloodType?: string;
  volume?: string;
  donationDate: string;
  locationName: string;
  certificateNo?: string;
}

interface DonationCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData;
}

export const DonationCertificateModal: React.FC<DonationCertificateModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const maskCccd = (idNum?: string): string => {
    if (!idNum) return '079******456';
    const str = idNum.trim();
    if (str.length <= 6) return '079******456';
    const prefix = str.slice(0, 3);
    const suffix = str.slice(-3);
    return `${prefix}******${suffix}`;
  };

  const formattedDonationDate = formatDateToDDMMYYYY(data.donationDate) || data.donationDate;
  const formattedDob = data.dateOfBirth
    ? (formatDateToDDMMYYYY(data.dateOfBirth) || data.dateOfBirth)
    : 'Chưa cập nhật';
  const maskedCccd = maskCccd(data.idDocumentNumber);
  const certNo = data.certificateNo || `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="certificate-modal-portal fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          /* Hide main application root so background pages like MyAppointments are 100% invisible on print */
          #root {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .certificate-modal-portal {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
          .certificate-container {
            padding: 0 !important;
            background: transparent !important;
          }
          .certificate-paper {
            width: 297mm !important;
            height: 210mm !important;
            max-width: none !important;
            max-height: none !important;
            border-width: 12px !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          .certificate-paper * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          .certificate-signature-text {
            font-family: 'Georgia', 'Times New Roman', serif !important;
          }
        }
      `}</style>

      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 print:shadow-none print:border-none print:max-w-none print:rounded-none">
        
        {/* Modal Top Toolbar (Hidden on Print) */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Giấy Chứng Nhận Hiến Máu Tình Nguyện - LifeLine</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#93000b] hover:bg-[#7a0009] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In / Tải PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Frame */}
        <div className="certificate-container p-4 md:p-8 bg-slate-100 flex justify-center items-center overflow-x-auto print:p-0 print:bg-white">
          <div
            ref={printRef}
            className="certificate-paper relative bg-[#fffdfa] w-[820px] h-[550px] p-6 border-[10px] border-[#93000b] shadow-2xl flex flex-col justify-between overflow-hidden print:w-full print:h-screen print:border-8 print:shadow-none"
            style={{
              backgroundImage: 'radial-gradient(#93000b 0.5px, transparent 0.5px)',
              backgroundSize: '24px 24px',
              backgroundColor: '#fffdf9'
            }}
          >
            {/* Outer Gold Inner Border */}
            <div className="absolute inset-3 border-2 border-amber-500/70 pointer-events-none rounded-sm"></div>
            <div className="absolute inset-4 border border-amber-400/40 pointer-events-none rounded-sm"></div>

            {/* Corner Decorative Ornaments */}
            <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-amber-500/80 pointer-events-none"></div>
            <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-amber-500/80 pointer-events-none"></div>
            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-amber-500/80 pointer-events-none"></div>
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-amber-500/80 pointer-events-none"></div>

            {/* Watermark Heart Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <Heart className="w-96 h-96 text-[#93000b] fill-current" />
            </div>

            {/* Header Section */}
            <div className="relative z-10 text-center space-y-0.5 pt-1">
              <div className="text-[11px] font-extrabold tracking-widest text-slate-700 uppercase font-sans">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-[10px] font-bold text-slate-600 tracking-wider font-sans">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="w-24 h-0.5 bg-amber-500 mx-auto my-1"></div>

              <div className="pt-1 flex items-center justify-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#93000b] flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                  LL
                </div>
                <span className="text-[11px] font-extrabold text-[#93000b] tracking-wider uppercase font-sans">
                  Nền Tảng Hiến Máu Tự Nguyện Quốc Gia • LifeLine Platform
                </span>
              </div>

              <h1 className="text-2xl md:text-[25px] font-black text-[#93000b] tracking-wide pt-1 uppercase font-sans">
                GIẤY CHỨNG NHẬN HIẾN MÁU TÌNH NGUYỆN
              </h1>
              <p className="text-[11px] font-bold text-amber-700 italic font-sans">
                CERTIFICATE OF VOLUNTARY BLOOD DONATION
              </p>
            </div>

            {/* Body Content */}
            <div className="relative z-10 text-center space-y-3 my-1 px-4">
              <p className="text-xs text-slate-600 font-medium font-sans">
                Ban Chỉ Đạo Vận Động Hiến Máu Tình Nguyện Trân Trọng Chứng Nhận:
              </p>

              {/* Donor Name */}
              <div className="space-y-0.5">
                <h2 className="text-2xl md:text-[27px] font-black text-[#271816] tracking-wider uppercase font-sans">
                  {data.donorName || 'NGUYỄN VĂN A'}
                </h2>
                
                {/* ID & Date of Birth */}
                <div className="flex justify-center items-center gap-4 text-xs text-slate-700 font-semibold pt-0.5 font-sans">
                  <span>Số CCCD: <strong className="text-slate-900 font-extrabold">{maskedCccd}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Ngày sinh: <strong className="text-slate-900 font-extrabold">{formattedDob}</strong></span>
                </div>
              </div>

              <p className="text-xs text-slate-700 max-w-xl mx-auto leading-relaxed font-sans">
                Đã tham gia hiến máu tình nguyện cứu người tại chiến dịch <strong className="text-[#93000b] font-bold">{data.locationName}</strong> vào ngày <strong className="text-[#93000b] font-bold">{formattedDonationDate}</strong>. Nghĩa cử cao đẹp của Ông/Bà đã góp phần mang lại sự sống cho người bệnh.
              </p>

              {/* Highlight Badge Info Box */}
              <div className="inline-flex items-center gap-6 md:gap-8 bg-amber-50/90 border border-amber-200 rounded-2xl px-6 py-2 shadow-2xs font-sans">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-[#93000b] fill-[#93000b]" />
                  <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Nhóm máu</div>
                    <div className="text-sm font-black text-[#93000b]">{data.bloodType || 'O+'}</div>
                  </div>
                </div>

                <div className="h-6 w-px bg-amber-300"></div>

                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Thể tích hiến</div>
                    <div className="text-sm font-black text-[#271816]">{data.volume || '350 ml'}</div>
                  </div>
                </div>

                <div className="h-6 w-px bg-amber-300"></div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Trạng thái</div>
                    <div className="text-sm font-black text-emerald-700">Đã ghi nhận</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Signatures & QR Section (Perfectly aligned inside inner gold border) */}
            <div className="relative z-10 flex justify-between items-end px-3 pb-1 text-xs font-sans">
              {/* QR Verification Code (Bottom-Left) */}
              <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-xl border border-amber-300 shadow-2xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=LifeLineCert-${certNo}`}
                  alt="Certificate QR Verification"
                  className="w-12 h-12 rounded-md shrink-0 border border-slate-200"
                />
                <div className="flex flex-col text-left justify-center">
                  <span className="text-[10px] font-extrabold text-[#93000b] uppercase tracking-wide">LifeLine Verify</span>
                  <span className="text-[9px] font-mono font-bold text-slate-700">Mã: {certNo}</span>
                  <span className="text-[8px] text-slate-500 font-medium">Quét để xác thực</span>
                </div>
              </div>

              {/* Center Seal */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-600 flex items-center justify-center p-0.5 bg-amber-50/80 shadow-2xs">
                  <div className="w-full h-full rounded-full bg-[#93000b] text-amber-300 flex flex-col items-center justify-center text-[7px] font-bold text-center leading-none shadow-inner">
                    <span>LIFELINE</span>
                    <span className="text-[6px] tracking-widest">SEAL</span>
                  </div>
                </div>
                <span className="text-[8px] text-amber-800 font-bold mt-1 tracking-wider uppercase">ĐÃ XÁC THỰC</span>
              </div>

              {/* Signature Section (Bottom-Right) */}
              <div className="text-right flex flex-col items-end space-y-0.5 max-w-[210px]">
                <div className="text-[10px] text-slate-600 font-medium italic">TP. Hồ Chí Minh, ngày {formattedDonationDate}</div>
                <div className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">TM. BAN CHỈ ĐẠO LIFELINE</div>
                <div className="h-10 flex items-center justify-end my-0.5">
                  <span className="certificate-signature-text font-serif italic text-base text-[#93000b] font-bold select-none">
                    Dr. LifeLine Director
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
