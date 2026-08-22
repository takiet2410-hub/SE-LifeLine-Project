import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  FileCheck2,
  QrCode,
  HeartHandshake,
  Coffee,
  Award,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  X,
  Compass,
  ArrowUpRight,
  Calendar,
  Heart,
  BookOpen,
} from 'lucide-react';

interface ProcessStep {
  id: string;
  stepNumber: string;
  badge: string;
  title: string;
  shortDesc: string;
  detailedDesc: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  menuRef: {
    menuName: string;
    menuPath: string;
    icon: React.ComponentType<{ className?: string }>;
    guide: string;
    actionText: string;
  };
}

export const DonationProcessSection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null);

  const steps: ProcessStep[] = [
    {
      id: 'step-1',
      stepNumber: '01',
      badge: 'Khám phá & Đặt lịch',
      title: 'Tìm Điểm Hiến & Đặt Lịch Hẹn',
      shortDesc: 'Tra cứu điểm hiến gần nhất trên bản đồ GPS và chọn khung giờ hẹn 30 phút linh hoạt.',
      detailedDesc:
        'Người hiến máu dễ dàng tra cứu các Trung tâm hiến máu cố định hoặc các điểm hiến máu lưu động gần vị trí của mình trên bản đồ tương tác. Bạn có thể tự do lựa chọn ngày hẹn và khung giờ tiếp nhận phù hợp để tránh phải xếp hàng chờ đợi.',
      features: [
        'Bản đồ tương tác GPS định vị điểm tiếp nhận gần nhất',
        'Lựa chọn khung giờ hẹn linh hoạt, tránh chờ đợi',
        'Theo dõi nhu cầu các nhóm máu đang cần khẩn cấp',
      ],
      icon: MapPin,
      iconBg: 'bg-red-50',
      iconColor: 'text-[#93000b]',
      borderColor: 'border-red-200',
      menuRef: {
        menuName: 'Bản đồ hiến máu',
        menuPath: '/map',
        icon: MapPin,
        guide: 'Mở mục "Bản đồ hiến máu" trên thanh Menu bên trái (hoặc bấm nút Đặt lịch trên Trang chủ) để xem danh sách điểm hiến gần bạn và bắt đầu đặt lịch.',
        actionText: 'Mở Bản đồ hiến máu',
      },
    },
    {
      id: 'step-2',
      stepNumber: '02',
      badge: 'Khảo sát y tế',
      title: 'Điền Phiếu Sàng Lọc Sức Khỏe',
      shortDesc: 'Trả lời bộ câu hỏi y tế trực tuyến trước khi đến điểm hiến để đánh giá sơ bộ điều kiện.',
      detailedDesc:
        'Hệ thống tích hợp phiếu sàng lọc điện tử đạt chuẩn y tế. Thuật toán tự động kiểm tra khoảng cách giãn cách 84 ngày giữa 2 lần hiến máu, độ tuổi (18-60), cân nặng và tiền sử sức khỏe trước khi đến điểm hẹn.',
      features: [
        'Tự động kiểm tra khoảng cách tối thiểu 84 ngày',
        'Tiết kiệm 80% thời gian kê khai giấy tờ thủ công',
        'Đánh giá sơ bộ điều kiện hiến máu an toàn',
      ],
      icon: FileCheck2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      menuRef: {
        menuName: 'Đặt lịch hiến máu (Bước 2)',
        menuPath: '/map',
        icon: FileCheck2,
        guide: 'Tại màn hình đặt lịch (thuộc Menu "Bản đồ hiến máu"), hệ thống sẽ tự động chuyển bạn qua bước điền 12 câu hỏi sàng lọc y tế điện tử.',
        actionText: 'Bắt đầu Đặt lịch & Khảo sát',
      },
    },
    {
      id: 'step-3',
      stepNumber: '03',
      badge: 'Vé điện tử E-Ticket',
      title: 'Nhận Thẻ E-Ticket & Check-in QR',
      shortDesc: 'Nhận thẻ hẹn điện tử kèm mã QR cá nhân hóa để check-in siêu tốc chỉ trong 10 giây.',
      detailedDesc:
        'Khi đơn đăng ký được duyệt, hệ thống cấp phát thẻ E-Ticket kèm mã QR định danh duy nhất. Khi đến điểm hiến, bạn chỉ cần xuất trình mã QR trên điện thoại để nhân viên y tế quét tiếp đón ngay lập tức.',
      features: [
        'Mã QR E-Ticket định danh riêng cho từng lịch hẹn',
        'Check-in 1 chạm chỉ mất 10 giây tại bàn tiếp đón',
        'Đồng bộ thông tin cá nhân và tiền sử sức khỏe số hóa',
      ],
      icon: QrCode,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      menuRef: {
        menuName: 'Lịch hẹn của tôi',
        menuPath: '/my-appointments',
        icon: Calendar,
        guide: 'Mở mục "Lịch hẹn của tôi" trên thanh Menu để xem danh sách lịch hẹn đã duyệt, lấy mã QR E-Ticket hoặc kiểm tra mục "Thông báo".',
        actionText: 'Xem Lịch hẹn của tôi',
      },
    },
    {
      id: 'step-4',
      stepNumber: '04',
      badge: 'Tiếp nhận an toàn',
      title: 'Khám Sàng Lọc & Lấy Máu',
      shortDesc: 'Bác sĩ kiểm tra sinh hiệu, đo huyết áp và lấy máu an toàn 100% bằng dụng cụ vô trùng.',
      detailedDesc:
        'Bác sĩ chuyên khoa thăm khám đo huyết áp, nhịp tim, test nhanh nhóm máu và nồng độ huyết sắc tố. Quá trình lấy máu diễn ra trong môi trường vô trùng tuyệt đối với túi lấy máu tiệt trùng sử dụng một lần duy nhất.',
      features: [
        'Bác sĩ kiểm tra sinh hiệu, huyết áp và huyết sắc tố',
        'Dụng cụ lấy máu vô trùng 100% sử dụng một lần',
        'Thời gian lấy máu thực tế êm ái chỉ mất 8 - 10 phút',
      ],
      icon: HeartHandshake,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-700',
      borderColor: 'border-rose-200',
      menuRef: {
        menuName: 'Lịch hẹn & Điểm hiến máu',
        menuPath: '/my-appointments',
        icon: QrCode,
        guide: 'Đến đúng điểm hiến máu đã chọn trong mục "Lịch hẹn của tôi", xuất trình thẻ QR E-Ticket trên ứng dụng và CCCD tại bàn đón tiếp.',
        actionText: 'Mở Thẻ QR Check-in',
      },
    },
    {
      id: 'step-5',
      stepNumber: '05',
      badge: 'Nghỉ ngơi & Tri ân',
      title: 'Hồi Phục Sức Khỏe & Nhận Quà',
      shortDesc: 'Nghỉ ngơi 15 phút tại khu vực hồi sức, dùng suất ăn nhẹ nạp năng lượng và nhận quà tri ân.',
      detailedDesc:
        'Sau khi hoàn tất lấy máu, bạn được hướng dẫn sang khu vực hồi sức thoáng mát, dùng sữa tươi và bánh ngọt để phục hồi thể lực. Bạn sẽ nhận được Giấy chứng nhận hiến máu tình nguyện cùng quà tặng kỷ niệm.',
      features: [
        'Khu vực nghỉ ngơi có điều dưỡng theo dõi sức khỏe',
        'Suất ăn nhẹ và đồ uống bổ sung dinh dưỡng tức thì',
        'Giấy chứng nhận hiến máu tình nguyện & Quà tri ân',
      ],
      icon: Coffee,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      menuRef: {
        menuName: 'Bảng tin & Cẩm nang',
        menuPath: '/news',
        icon: BookOpen,
        guide: 'Nghỉ ngơi tại điểm hiến. Bạn có thể tham khảo thêm cẩm nang dinh dưỡng và lưu ý phục hồi sức khỏe tại mục "Bảng tin" hoặc mục "Cẩm nang hiến máu" ngay bên dưới.',
        actionText: 'Xem Cẩm nang sức khỏe',
      },
    },
    {
      id: 'step-6',
      stepNumber: '06',
      badge: 'Tác động & Vinh danh',
      title: 'Tích Lũy Điểm Thưởng & Vinh Danh',
      shortDesc: 'Cập nhật kết quả xét nghiệm an toàn máu, tích luỹ điểm thưởng XP và nhận huy hiệu danh dự.',
      detailedDesc:
        'Hồ sơ số của bạn được lưu giữ và bảo mật trọn đời. Hệ thống tự động cộng điểm XP nâng cấp bậc người hiến (Đồng, Bạc, Vàng, Kim Cương), mở khóa các huy hiệu danh dự và gửi thông báo khi giọt máu của bạn được cấp phát cứu người.',
      features: [
        'Lưu trữ hồ sơ sức khỏe và xét nghiệm máu số hóa trọn đời',
        'Tích lũy điểm thưởng XP, nâng hạng cấp bậc vinh danh',
        'Nhận thông báo khi giọt máu được điều phối tới bệnh viện',
      ],
      icon: Award,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      menuRef: {
        menuName: 'Hồ sơ của tôi',
        menuPath: '/profile',
        icon: Heart,
        guide: 'Mở mục "Hồ sơ của tôi" trên thanh Menu để theo dõi tiến trình nâng hạng, xem các huy hiệu đã đạt, chứng nhận số và lịch sử các lần hiến máu.',
        actionText: 'Mở Hồ sơ & Thành tích',
      },
    },
  ];

  return (
    <section className="mb-8">
      {/* Section Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-[#93000b] flex items-center justify-center border border-red-100 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#271816]">Quy Trình Hiến Máu Toàn Diện</h2>
            <p className="text-[12px] text-[#6c757d] font-medium">
              6 bước chuẩn y khoa kèm hướng dẫn vị trí thao tác trên thanh Menu cho người mới bắt đầu
            </p>
          </div>
        </div>
      </div>

      {/* 6 Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {steps.map((step) => {
          const IconComp = step.icon;
          return (
            <div
              key={step.id}
              onClick={() => setSelectedStep(step)}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#f1f3f5] shadow-xs hover:shadow-md hover:border-red-200 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Header: Icon + Number + Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${step.iconBg} ${step.iconColor} flex items-center justify-center border ${step.borderColor} group-hover:scale-105 transition-transform shrink-0`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {step.badge}
                    </span>
                    <span className="text-[16px] font-extrabold text-slate-300 group-hover:text-[#93000b] transition-colors">
                      {step.stepNumber}
                    </span>
                  </div>
                </div>

                {/* Step Title & Short Description */}
                <h3 className="font-bold text-[14px] text-[#271816] group-hover:text-[#93000b] transition-colors leading-snug mb-1.5 line-clamp-1">
                  {step.title}
                </h3>
                <p className="text-[12px] text-[#5b403d] leading-relaxed line-clamp-2 mb-3 font-normal">
                  {step.shortDesc}
                </p>
              </div>

              {/* Bottom Row: Menu Navigation Link Hint */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#455f87] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 truncate max-w-[170px]">
                  <Compass className="w-3 h-3 text-[#455f87] shrink-0" />
                  <span className="truncate">Menu: <strong>{step.menuRef.menuName}</strong></span>
                </span>
                <span className="text-[#93000b] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Details Modal */}
      {selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${selectedStep.iconBg} ${selectedStep.iconColor} flex items-center justify-center border ${selectedStep.borderColor} shrink-0`}>
                  {React.createElement(selectedStep.icon, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#93000b] uppercase tracking-wider block">
                    Bước {selectedStep.stepNumber} • {selectedStep.badge}
                  </span>
                  <h3 className="text-base font-bold text-[#271816]">
                    {selectedStep.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedStep(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 py-1 max-h-[60vh] overflow-y-auto pr-1">
              {/* Menu Reference Callout Box */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-blue-900 uppercase flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    Vị trí thực hiện trên thanh Menu:
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md shrink-0">
                    {selectedStep.menuRef.menuName}
                  </span>
                </div>
                <p className="text-[12px] text-slate-700 leading-relaxed font-normal">
                  {selectedStep.menuRef.guide}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider mb-1">Mô tả quy trình</h4>
                <p className="text-[13px] text-[#271816] leading-relaxed font-normal">
                  {selectedStep.detailedDesc}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider mb-2">Quy chuẩn & Tiện ích công nghệ</h4>
                <div className="space-y-2">
                  {selectedStep.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#fff8f7] border border-red-100 text-[12px] text-[#271816]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedStep(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const targetPath = selectedStep.menuRef.menuPath;
                  setSelectedStep(null);
                  navigate(targetPath);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#93000b] hover:bg-[#780009] text-white text-[13px] font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>{selectedStep.menuRef.actionText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
