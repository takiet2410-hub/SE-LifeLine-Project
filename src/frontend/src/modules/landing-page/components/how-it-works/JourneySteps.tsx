import React, { useState } from 'react';
import {
  MapPin,
  FileCheck2,
  QrCode,
  HeartHandshake,
  Coffee,
  Award,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface ProcessStep {
  id: string;
  stepNumber: string;
  badge: string;
  title: string;
  shortDesc: string;
  detailedDesc: string;
  features: string[];
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

export const JourneySteps: React.FC = () => {
  const [activePrepTab, setActivePrepTab] = useState<'before' | 'during' | 'after'>('before');
  const [selectedStepModal, setSelectedStepModal] = useState<ProcessStep | null>(null);

  const steps: ProcessStep[] = [
    {
      id: 'step-1',
      stepNumber: '01',
      badge: 'Khám phá & Đặt lịch',
      title: 'Tìm Điểm Hiến Máu & Chọn Lịch Hẹn Linh Hoạt',
      shortDesc: 'Tra cứu các Trung tâm hiến máu cố định và Điểm hiến máu lưu động gần bạn trên bản đồ GPS tương tác.',
      detailedDesc:
        'Người hiến máu có thể dễ dàng tìm kiếm các điểm hiến máu cố định tại các bệnh viện lớn hoặc các đợt hiến máu lưu động tại trường học, khu dân cư. Bạn có thể tự do lựa chọn ngày hẹn và khung giờ tiếp nhận (Timeslot 30 phút) phù hợp với lịch trình cá nhân để không phải xếp hàng chờ đợi.',
      features: [
        'Bản đồ tương tác GPS định vị điểm tiếp nhận gần nhất',
        'Lựa chọn khung giờ hẹn (Timeslot) tránh ùn tắc',
        'Theo dõi nhu cầu các nhóm máu đang cần khẩn cấp (A, B, AB, O)',
      ],
      icon: <MapPin className="w-6 h-6" />,
      iconBg: 'bg-red-50',
      iconColor: 'text-[#93000B]',
      borderColor: 'border-red-200',
    },
    {
      id: 'step-2',
      stepNumber: '02',
      badge: 'Khảo sát y tế sơ bộ',
      title: 'Điền Phiếu Sàng Lọc Sức Khỏe Trực Tuyến',
      shortDesc: 'Trả lời bộ câu hỏi y tế (Pre-Screening) ngay trên điện thoại hoặc máy tính trước khi đến điểm hiến.',
      detailedDesc:
        'Để đảm bảo an toàn tuyệt đối cho người hiến và người nhận máu, LifeLine tích hợp phiếu sàng lọc điện tử. Thuật toán thông minh sẽ tự động kiểm tra khoảng cách giãn cách 84 ngày giữa 2 lần hiến, độ tuổi (18-60), cân nặng (≥42kg với nữ, ≥45kg với nam) và tiền sử bệnh lý để đánh giá sơ bộ điều kiện hiến.',
      features: [
        'Tự động kiểm tra khoảng cách giãn cách 84 ngày',
        'Cắt giảm 80% thời gian kê khai giấy tờ thủ công tại chỗ',
        'Hệ thống đánh giá sơ bộ điều kiện hiến máu đạt chuẩn y tế',
      ],
      icon: <FileCheck2 className="w-6 h-6" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'step-3',
      stepNumber: '03',
      badge: 'Vé điện tử E-Ticket',
      title: 'Nhận Thẻ E-Ticket & Check-in QR Siêu Tốc',
      shortDesc: 'Khi Trung tâm phê duyệt đơn đăng ký, bạn nhận ngay thẻ điện tử E-Ticket chứa mã QR cá nhân hóa.',
      detailedDesc:
        'Sau khi đơn đăng ký được cán bộ y tế tại Trung Tâm Hiến Máu duyệt, hệ thống sẽ phát hành thẻ E-Ticket kèm mã QR duy nhất gửi qua email và hiển thị trên ứng dụng. Khi đến điểm hiến máu, bạn chỉ cần xuất trình mã QR để nhân viên y tế quét check-in trong vòng 10 giây.',
      features: [
        'Mã QR E-Ticket định danh duy nhất cho từng lịch hẹn',
        'Check-in 1 chạm chỉ mất 10 giây tại bàn tiếp đón',
        'Tích hợp thông tin cá nhân và tiền sử sức khỏe số hóa',
      ],
      icon: <QrCode className="w-6 h-6" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      id: 'step-4',
      stepNumber: '04',
      badge: 'Tiếp nhận an toàn',
      title: 'Khám Lâm Sàng & Lấy Máu An Toàn 100%',
      shortDesc: 'Bác sĩ chuyên khoa kiểm tra sinh hiệu, đo huyết áp và tiến hành lấy máu theo quy chuẩn Bộ Y Tế.',
      detailedDesc:
        'Bác sĩ thăm khám đo huyết áp, nhịp tim, test nhanh nhóm máu và nồng độ huyết sắc tố (Hb). Quá trình lấy máu diễn ra trong môi trường vô trùng tuyệt đối, sử dụng túi máu và kim tiêm tiệt trùng dùng 1 lần. Bạn có thể chọn lượng máu hiến phù hợp (250ml, 350ml hoặc 450ml).',
      features: [
        'Bác sĩ đo sinh hiệu, huyết áp và kiểm tra huyết sắc tố',
        'Trang thiết bị vô trùng 100% sử dụng một lần duy nhất',
        'Thời gian lấy máu thực tế chỉ mất 8 - 10 phút rất êm ái',
      ],
      icon: <HeartHandshake className="w-6 h-6" />,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-700',
      borderColor: 'border-rose-200',
    },
    {
      id: 'step-5',
      stepNumber: '05',
      badge: 'Nghỉ ngơi & Tri ân',
      title: 'Hồi Phục Sức Khỏe & Nhận Quà Tặng Ý Nghĩa',
      shortDesc: 'Nghỉ ngơi 15 phút tại khu vực hồi sức, thưởng thức suất ăn nhẹ nạp năng lượng và nhận quà tri ân.',
      detailedDesc:
        'Sau khi hoàn tất lấy máu, bạn được hướng dẫn sang khu vực hồi sức thoáng mát. Tại đây, tình nguyện viên phục vụ sữa tươi, trà ấm, bánh ngọt để bổ sung đường và dịch thể. Bạn sẽ nhận được Giấy chứng nhận hiến máu tình nguyện cùng quà tặng kỷ niệm và hỗ trợ chi phí đi lại theo quy định.',
      features: [
        'Khu vực nghỉ dưỡng rộng rãi, có y tá theo dõi sức khỏe',
        'Suất ăn nhẹ và đồ uống bổ sung dinh dưỡng tức thì',
        'Giấy chứng nhận hiến máu tình nguyện & Quà tặng tri ân',
      ],
      icon: <Coffee className="w-6 h-6" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
      borderColor: 'border-amber-200',
    },
    {
      id: 'step-6',
      stepNumber: '06',
      badge: 'Tác động & Vinh danh',
      title: 'Tích Lũy Điểm Thưởng XP & Theo Dõi Giọt Máu',
      shortDesc: 'Hồ sơ hiến máu số được cập nhật kết quả xét nghiệm an toàn máu và tích luỹ điểm thưởng nâng cấp bậc.',
      detailedDesc:
        'Mẫu máu được chuyển về phòng xét nghiệm sàng lọc 5 bệnh truyền nhiễm (HIV, HBV, HCV, Giang mai, Sốt rét) và xác định nhóm máu chính xác. Hồ sơ số của bạn sẽ được lưu giữ trọn đời. Đồng thời, hệ thống tự động cộng điểm XP, mở khóa huy hiệu vinh danh và thông báo khi giọt máu của bạn đã đến tay bệnh viện cứu sống người bệnh.',
      features: [
        'Hồ sơ sức khỏe số trọn đời bảo mật tuyệt đối',
        'Cộng điểm XP, nâng hạng cấp bậc Donor (Đồng, Bạc, Vàng, Kim Cương)',
        'Nhận thông báo khi giọt máu được cấp phát tới bệnh viện',
      ],
      icon: <Award className="w-6 h-6" />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <section id="process-steps" className="py-20 px-6 lg:px-12 bg-white w-full scroll-mt-20">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-16 w-full">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-[#93000B] font-bold text-xs tracking-wider uppercase shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#93000B]" />
            <span>QUY TRÌNH HIẾN MÁU TOÀN DIỆN</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#271816] tracking-tight leading-tight">
            Quy Trình 6 Bước Hiến Máu Thông Minh Cùng LifeLine
          </h2>

          <p className="text-[#6c757d] text-base sm:text-lg leading-relaxed font-normal">
            Trải nghiệm hiến máu hiện đại, an toàn và liền mạch từ lúc đặt lịch trực tuyến đến khi giọt máu của bạn được chuyển đến cứu sống bệnh nhân.
          </p>
        </div>

        {/* 6 Step Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {steps.map((step) => (
            <div
              key={step.id}
              onClick={() => setSelectedStepModal(step)}
              className="bg-white rounded-2xl border border-[#e9ecef] hover:border-red-300 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
            >
              {/* Top Row: Icon + Step Number */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${step.iconBg} ${step.iconColor} flex items-center justify-center border ${step.borderColor} transition-transform group-hover:scale-110 shadow-2xs`}>
                  {step.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {step.badge}
                  </span>
                  <span className="text-[20px] font-extrabold text-slate-300 group-hover:text-[#93000B] transition-colors">
                    {step.stepNumber}
                  </span>
                </div>
              </div>

              {/* Step Title & Short Desc */}
              <div className="space-y-2 mb-4">
                <h3 className="text-[17px] font-bold text-[#271816] group-hover:text-[#93000B] transition-colors leading-snug">
                  {step.title}
                </h3>
                <p className="text-[13px] text-[#5B403D] leading-relaxed line-clamp-3">
                  {step.shortDesc}
                </p>
              </div>

              {/* Key Features List */}
              <div className="space-y-2 pt-3 border-t border-slate-100 mb-4">
                {step.features.slice(0, 2).map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px] text-[#495057]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Card Footer: Action */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-100 text-[12px]">
                <span className="text-[#93000B] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  <span>Chi tiết bước này</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Modal for Step Details */}
        {selectedStepModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${selectedStepModal.iconBg} ${selectedStepModal.iconColor} flex items-center justify-center border ${selectedStepModal.borderColor}`}>
                    {selectedStepModal.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#93000B] uppercase tracking-wider">
                      Bước {selectedStepModal.stepNumber} • {selectedStepModal.badge}
                    </span>
                    <h3 className="text-[18px] font-bold text-[#271816]">
                      {selectedStepModal.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStepModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="py-5 space-y-4">
                <div>
                  <h4 className="text-[13px] font-bold text-[#6c757d] uppercase mb-1">Mô tả chi tiết</h4>
                  <p className="text-[14px] text-[#271816] leading-relaxed">
                    {selectedStepModal.detailedDesc}
                  </p>
                </div>

                <div>
                  <h4 className="text-[13px] font-bold text-[#6c757d] uppercase mb-2">Tính năng công nghệ trên LifeLine</h4>
                  <div className="space-y-2">
                    {selectedStepModal.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[13px] text-[#271816]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedStepModal(null)}
                  className="px-6 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white !text-white text-[14px] font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  style={{ color: '#ffffff' }}
                >
                  <span className="text-white !text-white" style={{ color: '#ffffff' }}>Đã hiểu</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preparation Guide Tabs Section */}
        <div className="w-full bg-[#FFF8F7] border border-red-100 rounded-3xl p-6 sm:p-10 shadow-2xs">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#271816] tracking-tight">
              Cẩm Nang Chuẩn Bị Sức Khỏe Dành Cho Người Hiến
            </h3>
            <p className="text-[#6c757d] text-[14px] mt-1">
              Những lưu ý y khoa quan trọng để có một hành trình hiến máu khỏe khoắn và an toàn nhất.
            </p>
          </div>

          {/* Tabs Pill Switcher */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {[
              { id: 'before', label: '1. Trước khi hiến máu', icon: <ShieldCheck className="w-4 h-4" /> },
              { id: 'during', label: '2. Trong khi hiến máu', icon: <Zap className="w-4 h-4" /> },
              { id: 'after', label: '3. Sau khi hiến máu', icon: <HeartHandshake className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePrepTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activePrepTab === tab.id
                    ? 'bg-[#93000b] hover:bg-[#7a0009] text-white !text-white shadow-sm'
                    : 'bg-white text-[#5B403D] border border-red-100 hover:bg-red-50/50'
                }`}
                style={activePrepTab === tab.id ? { color: '#ffffff' } : undefined}
              >
                {tab.icon}
                <span style={activePrepTab === tab.id ? { color: '#ffffff' } : undefined}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1 Content: Trước khi hiến */}
          {activePrepTab === 'before' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">💤 Giấc ngủ sâu</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Ngủ đủ ít nhất 6 - 8 tiếng vào đêm hôm trước. Không thức khuya để giữ huyết áp và nhịp tim ổn định.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">🥗 Bữa ăn nhẹ</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Ăn nhẹ trước khi hiến (bánh mì, ngũ cốc, cháo...). Tuyệt đối không ăn đồ nhiều dầu mỡ hay nhịn đói.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">🚫 Tránh đồ có cồn</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Không uống rượu bia, chất kích thích trong 24 giờ trước khi hiến. Uống bổ sung 500ml nước lọc.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2 Content: Trong khi hiến */}
          {activePrepTab === 'during' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">😌 Tâm lý thoải mái</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Thả lỏng cơ thể trên ghế nằm, hít thở đều và sâu. Quá trình lấy máu diễn ra rất nhẹ nhàng và nhanh chóng.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">✊ Bóp bóng nhẹ nhàng</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Nắm và bóp nhẹ quả bóng cao su theo hướng dẫn của điều dưỡng để dòng máu chảy đều đặn vào túi lấy máu.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">🗣️ Báo ngay khi có dấu hiệu lạ</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Nếu cảm thấy chóng mặt, vã mồ hôi hay buồn nôn, hãy báo ngay cho nhân viên y tế bên cạnh để được hỗ trợ kịp thời.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3 Content: Sau khi hiến */}
          {activePrepTab === 'after' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">🥤 Bổ sung nước & Dinh dưỡng</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Uống nhiều nước (2-3 lít nước trong ngày), ăn đầy đủ các thực phẩm giàu chất sắt như thịt bò, trứng, đậu, rau xanh.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">🩹 Giữ băng dán vị trí tiêm</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Giữ miếng băng gạc sạch sẽ trong ít nhất 4 - 6 tiếng để vết kim liền sẹo tốt và tránh nhiễm trùng.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-2xs space-y-2">
                <p className="text-[14px] font-bold text-[#271816]">🏋️ Tránh vận động nặng</p>
                <p className="text-[13px] text-[#5B403D] leading-relaxed">
                  Không chơi thể thao cường độ cao, nâng tạ, chạy bộ hoặc lái xe đường dài trong vòng 24 giờ sau khi hiến máu.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
