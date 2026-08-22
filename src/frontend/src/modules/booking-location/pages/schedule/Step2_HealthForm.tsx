import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { EligibilityOverlay } from '../../components/BookingOverlays';
import { toast } from 'sonner';

export const Step2_HealthForm: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useScheduleContext();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, []);

  const [showEligibilityOverlay, setShowEligibilityOverlay] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState('');

  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>(data.healthAnswers || {
    s1: null,
    s2: null, s2_note: '',
    s3: null, s3_note: '',
    s4: [], s4_note: '',
    s5: [],
    s6: [],
    s7: [], s7_note: '',
    s8: [], s8_note: '',
  });

  const checkRejectAnswers = (ans: Record<string, any>): string | null => {
    if (ans.s3 === 'yes') {
      return 'Bạn đã ghi nhận có tiền sử bệnh truyền nhiễm nguy hiểm (Viêm gan B, C, HIV,...) thuộc danh mục không đủ điều kiện hiến máu.';
    }
    const rejectItemsS4 = ['recovered', 'blood'];
    if (ans.s4?.some((item: string) => rejectItemsS4.includes(item))) {
      return 'Bạn có tiền sử mắc bệnh hoặc từng truyền máu thuộc danh mục tạm hoãn hiến máu theo quy định y tế.';
    }
    const rejectItemsS5 = ['recovered', 'weightloss', 'lymph', 'tattoo', 'drugs', 'contact', 'livewith', 'sex', 'samesex'];
    if (ans.s5?.some((item: string) => rejectItemsS5.includes(item))) {
      return 'Thông tin khảo sát của bạn chứa yếu tố thuộc danh mục tạm hoãn hiến máu theo quy định Bộ Y tế.';
    }
    const rejectItemsS6 = ['recovered', 'epidemic'];
    if (ans.s6?.some((item: string) => rejectItemsS6.includes(item))) {
      return 'Tiền sử dịch tễ hoặc bệnh gần đây cần thời gian theo dõi bổ sung trước khi đủ điều kiện hiến máu.';
    }
    if (ans.s7?.includes('flu')) {
      return 'Bạn đang có triệu chứng cảm cúm/sốt/ho. Vui lòng nghỉ ngơi hồi phục hoàn toàn trước khi đăng ký.';
    }
    return null;
  };

  const validateAllAnswers = (): string[] => {
    const missing: string[] = [];

    // Section 1
    if (!answers.s1) {
      missing.push('Section 1');
    }

    // Section 2
    if (!answers.s2) {
      missing.push('Section 2');
    } else if (answers.s2 === 'yes' && (!answers.s2_note || !answers.s2_note.trim())) {
      missing.push('Section 2');
    }

    // Section 3
    if (!answers.s3) {
      missing.push('Section 3');
    } else if (answers.s3 === 'other' && (!answers.s3_note || !answers.s3_note.trim())) {
      missing.push('Section 3');
    }

    // Section 4
    if (!answers.s4 || answers.s4.length === 0) {
      missing.push('Section 4');
    }

    // Section 5
    if (!answers.s5 || answers.s5.length === 0) {
      missing.push('Section 5');
    }

    // Section 6
    if (!answers.s6 || answers.s6.length === 0) {
      missing.push('Section 6');
    }

    // Section 7
    if (!answers.s7 || answers.s7.length === 0) {
      missing.push('Section 7');
    } else if (answers.s7.includes('other') && (!answers.s7_note || !answers.s7_note.trim())) {
      missing.push('Section 7');
    }

    // Section 8
    if (!answers.s8 || answers.s8.length === 0) {
      missing.push('Section 8');
    } else if (answers.s8.includes('other') && (!answers.s8_note || !answers.s8_note.trim())) {
      missing.push('Section 8');
    }

    return missing;
  };

  const handleNext = () => {
    const missing = validateAllAnswers();
    if (missing.length > 0) {
      setMissingSections(missing);
      toast.error('Vui lòng trả lời đầy đủ tất cả các phần câu hỏi trước khi chuyển sang bước tiếp theo.', {
        duration: 4000
      });

      // Smooth scroll to the first un-answered section
      const firstSectionNum = missing[0].replace('Section ', 'section-');
      const el = document.getElementById(firstSectionNum);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setMissingSections([]);

    const rejectReason = checkRejectAnswers(answers);
    if (rejectReason) {
      setEligibilityReason(rejectReason);
      setShowEligibilityOverlay(true);
      return;
    }

    updateData({ healthAnswers: answers });
    navigate('/my-appointments/schedule/step-3');
  };

  const handleBack = () => {
    updateData({ healthAnswers: answers });
    navigate('/my-appointments/schedule/step-1');
  };

  const setRadio = (key: string, val: string) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
    setMissingSections(prev => prev.filter(m => !m.includes(key.toUpperCase().replace('S', 'Section '))));
  };

  const setText = (key: string, val: string) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const toggleCheckbox = (key: string, val: string, isExclusiveNone = false) => {
    setAnswers(prev => {
      let currentArr = prev[key] || [];
      if (isExclusiveNone) {
        if (currentArr.includes(val)) return { ...prev, [key]: [] };
        return { ...prev, [key]: [val] };
      } else {
        currentArr = currentArr.filter((item: string) => item !== 'none');
        if (currentArr.includes(val)) {
          return { ...prev, [key]: currentArr.filter((item: string) => item !== val) };
        } else {
          return { ...prev, [key]: [...currentArr, val] };
        }
      }
    });
    setMissingSections(prev => prev.filter(m => !m.includes(key.toUpperCase().replace('S', 'Section '))));
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full max-w-[956px] mx-auto">
      
      {/* Warning Notice if any section is missing */}
      {missingSections.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-center gap-3 text-red-800 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-[13px] font-bold">
            Vui lòng hoàn thành đầy đủ {missingSections.length} mục câu hỏi bị bỏ trống bên dưới trước khi tiếp tục.
          </p>
        </div>
      )}

      {/* SECTION 1 */}
      <div id="section-1" className={`flex pb-6 flex-col items-center gap-6 rounded-xl border ${missingSections.includes('Section 1') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#F1F3F5]'} bg-[#FFF] shadow-xs w-full overflow-hidden transition-all`}>
        <div className="flex py-3 px-6 justify-between items-center bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 tracking-[0.025em]">CÂU 1: BẠN ĐÃ TỪNG HIẾN MÁU BAO GIỜ CHƯA?</p>
          {missingSections.includes('Section 1') && (
            <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full">Chưa trả lời</span>
          )}
        </div>
        <div className="flex items-center gap-8 w-full px-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={answers.s1 === 'yes'} onChange={() => setRadio('s1', 'yes')} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-base font-medium leading-6">Rồi (Yes)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={answers.s1 === 'no'} onChange={() => setRadio('s1', 'no')} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-base font-medium leading-6">Chưa (No)</span>
          </label>
        </div>
      </div>

      {/* SECTION 2 */}
      <div id="section-2" className={`flex flex-col items-start rounded-xl border ${missingSections.includes('Section 2') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#F1F3F5]'} bg-[#FFF] shadow-xs w-full overflow-hidden transition-all`}>
        <div className="flex py-3 px-6 justify-between items-center bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 tracking-[0.025em]">CÂU 2: BẠN CÓ ĐANG MẮC BỆNH MÃN TÍNH HOẶC BỆNH CẤP TÍNH NÀO KHÔNG?</p>
          {missingSections.includes('Section 2') && (
            <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full">Chưa trả lời</span>
          )}
        </div>
        <div className="flex p-6 flex-col items-start gap-4 w-full">
          <div className="flex items-center gap-8 w-full">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s2 === 'yes'} onChange={() => setRadio('s2', 'yes')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">Có (Yes)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s2 === 'no'} onChange={() => setRadio('s2', 'no')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">Không (No)</span>
            </label>
          </div>
          {answers.s2 === 'yes' && (
            <div className="flex flex-col items-start gap-1 w-full">
              <p className="text-[#6C757D] font-inter text-xs leading-4">Vui lòng nêu rõ tên bệnh (bắt buộc):</p>
              <input type="text" value={answers.s2_note} onChange={(e) => setText('s2_note', e.target.value)} className="w-full max-w-[448px] py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none focus:border-[#3B82F6]" placeholder="Tên bệnh đang điều trị..." />
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 */}
      <div id="section-3" className={`flex flex-col items-start rounded-xl border ${missingSections.includes('Section 3') ? 'border-red-500 ring-2 ring-red-[#DC3545]/20' : 'border-[#F1F3F5]'} bg-[#FFF] shadow-xs w-full overflow-hidden transition-all`}>
        <div className="flex py-3 px-6 justify-between items-center bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 tracking-[0.025em]">CÂU 3: BẠN CÓ TIỀN SỬ VIÊM GAN B, C, HIV HOẶC BỆNH TRUYỀN NHIỄM KHÔNG?</p>
          {missingSections.includes('Section 3') && (
            <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full">Chưa trả lời</span>
          )}
        </div>
        <div className="flex p-6 flex-col items-start gap-4 w-full">
          <div className="flex items-center gap-8 w-full flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s3 === 'yes'} onChange={() => setRadio('s3', 'yes')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">Có (Yes)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s3 === 'no'} onChange={() => setRadio('s3', 'no')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">Không (No)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s3 === 'other'} onChange={() => setRadio('s3', 'other')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">Bệnh khác</span>
            </label>
          </div>
          {answers.s3 === 'other' && (
            <input type="text" value={answers.s3_note} onChange={(e) => setText('s3_note', e.target.value)} className="w-full py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none focus:border-[#3B82F6]" placeholder="Chi tiết tình trạng bệnh..." />
          )}
        </div>
      </div>

      {/* SECTION 4 */}
      <div id="section-4" className={`flex flex-col items-start rounded-xl border ${missingSections.includes('Section 4') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#F1F3F5]'} bg-[#FFF] shadow-xs w-full overflow-hidden transition-all`}>
        <div className="flex py-3 px-6 justify-between items-center bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 tracking-[0.025em]">CÂU 4: TRONG 12 THÁNG QUA, BẠN CÓ TIỀN SỬ NÀO SAU ĐÂY KHÔNG?</p>
          {missingSections.includes('Section 4') && (
            <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full">Chưa trả lời</span>
          )}
        </div>
        <div className="flex p-6 flex-col items-start gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <label className="flex p-3 items-center gap-3 rounded-lg border border-[#F1F3F5] w-full cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={answers.s4?.includes('recovered')} onChange={() => toggleCheckbox('s4', 'recovered')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Mắc/khỏi bệnh sốt rét, giang mai, lao, viêm não, uốn ván, phẫu thuật...</span>
            </label>
            <label className="flex p-3 items-center gap-3 rounded-lg border border-[#F1F3F5] w-full cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={answers.s4?.includes('blood')} onChange={() => toggleCheckbox('s4', 'blood')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Được truyền máu hoặc các chế phẩm máu</span>
            </label>
            <label className="flex p-3 items-center gap-3 rounded-lg border border-[#F1F3F5] w-full cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={answers.s4?.includes('vaccine')} onChange={() => toggleCheckbox('s4', 'vaccine')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Tiêm vắc xin (loại vắc xin sống giảm độc lực...)</span>
            </label>
            <label className="flex p-3 items-center gap-3 rounded-lg border border-[#F1F3F5] w-full cursor-pointer hover:bg-blue-50/50">
              <input type="checkbox" checked={answers.s4?.includes('none')} onChange={() => toggleCheckbox('s4', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm font-bold leading-5">Không có yếu tố nào ở trên</span>
            </label>
          </div>
          <div className="flex flex-col items-start gap-1 w-full mt-2">
            <p className="text-[#6C757D] font-inter text-xs leading-4">Ghi chú bổ sung (nếu có):</p>
            <textarea value={answers.s4_note} onChange={(e) => setText('s4_note', e.target.value)} className="w-full h-[58px] py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none resize-none focus:border-[#3B82F6]"></textarea>
          </div>
        </div>
      </div>

      {/* SECTION 5 */}
      <div id="section-5" className={`flex flex-col items-start rounded-xl border ${missingSections.includes('Section 5') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#F1F3F5]'} bg-[#FFF] shadow-xs w-full overflow-hidden transition-all`}>
        <div className="flex py-3 px-6 justify-between items-center bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 tracking-[0.025em]">CÂU 5: TRONG 6 THÁNG QUA, BẠN CÓ THỰC HIỆN CÁC HÀNH VI / YẾU TỐ SAU?</p>
          {missingSections.includes('Section 5') && (
            <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full">Chưa trả lời</span>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 w-full">
          {[
            { id: 'recovered', label: 'Khỏi bệnh thương hàn, nhiễm trùng máu, bị bọ cạp/rắn cắn...' },
            { id: 'weightloss', label: 'Sút cân nhanh không rõ nguyên nhân' },
            { id: 'lymph', label: 'Nổi hạch kéo dài' },
            { id: 'invasive', label: 'Thực hiện thủ thuật y tế (nhổ răng, châm cứu, xỏ lỗ...)' },
            { id: 'tattoo', label: 'Xăm hình, xỏ lỗ tai/mũi' },
            { id: 'drugs', label: 'Sử dụng ma túy / chất gây nghiện' },
            { id: 'contact', label: 'Tiếp xúc trực tiếp với máu/dịch cơ thể người khác' },
            { id: 'livewith', label: 'Sống chung với người nhiễm Viêm gan B, C' },
            { id: 'sex', label: 'Quan hệ tình dục không an toàn' },
            { id: 'samesex', label: 'Quan hệ tình dục đồng giới' },
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s5?.includes(opt.id)} onChange={() => toggleCheckbox('s5', opt.id)} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">{opt.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer mt-2 col-span-full">
            <input type="checkbox" checked={answers.s5?.includes('none')} onChange={() => toggleCheckbox('s5', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-sm font-bold leading-5">Không có yếu tố nào ở trên</span>
          </label>
        </div>
      </div>

      {/* SECTION 6 */}
      <div id="section-6" className={`flex flex-col items-start rounded-xl border ${missingSections.includes('Section 6') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#F1F3F5]'} bg-[#FFF] shadow-xs w-full overflow-hidden transition-all`}>
        <div className="flex py-3 px-6 justify-between items-center bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 tracking-[0.025em]">CÂU 6: TRONG 1 THÁNG QUA, BẠN CÓ MẮC BỆNH HOẶC ĐI ĐẾN VÙNG DỊCH KHÔNG?</p>
          {missingSections.includes('Section 6') && (
            <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full">Chưa trả lời</span>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 w-full">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={answers.s6?.includes('recovered')} onChange={() => toggleCheckbox('s6', 'recovered')} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-sm leading-5">Khỏi bệnh viêm đường tiết niệu, viêm phổi, sởi, quai bị, sốt xuất huyết...</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={answers.s6?.includes('epidemic')} onChange={() => toggleCheckbox('s6', 'epidemic')} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-sm leading-5">Đi lưu trú tại vùng có dịch bệnh sốt rét, Zika, sốt xuất huyết...</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer mt-2 col-span-full">
            <input type="checkbox" checked={answers.s6?.includes('none')} onChange={() => toggleCheckbox('s6', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-sm font-bold leading-5">Không có yếu tố nào ở trên</span>
          </label>
        </div>
      </div>

      {/* SECTION 7 */}
      <div id="section-7" className={`flex flex-col items-start rounded-xl border ${missingSections.includes('Section 7') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#F1F3F5]'} bg-[#FFF] shadow-xs w-full overflow-hidden transition-all`}>
        <div className="flex py-3 px-6 justify-between items-center bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 tracking-[0.025em]">CÂU 7: TRONG 14 NGÀY QUA, BẠN CÓ TRIỆU CHỨNG CẢM CÚM, SỐT, HO KHÔNG?</p>
          {missingSections.includes('Section 7') && (
            <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full">Chưa trả lời</span>
          )}
        </div>
        <div className="p-6 flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s7?.includes('flu')} onChange={() => toggleCheckbox('s7', 'flu')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Có triệu chứng cảm cúm, sốt, ho, đau đầu, đau họng, chảy mũi</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s7?.includes('none')} onChange={() => toggleCheckbox('s7', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm font-bold leading-5">Không có triệu chứng trên</span>
            </label>
          </div>
          <div className="flex flex-col items-start gap-2 w-full mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s7?.includes('other')} onChange={() => toggleCheckbox('s7', 'other')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Triệu chứng khác (ghi rõ)</span>
            </label>
            {answers.s7?.includes('other') && (
              <input type="text" value={answers.s7_note} onChange={(e) => setText('s7_note', e.target.value)} className="w-full py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none focus:border-[#3B82F6]" placeholder="Mô tả triệu chứng..." />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 8 */}
      <div id="section-8" className={`flex flex-col items-start rounded-xl border ${missingSections.includes('Section 8') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#F1F3F5]'} bg-[#FFF] shadow-xs w-full overflow-hidden transition-all`}>
        <div className="flex py-3 px-6 justify-between items-center bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 tracking-[0.025em]">CÂU 8: TRONG 7 NGÀY QUA, BẠN CÓ DÙNG THUỐC KHÁNG SINH HOẶC THUỐC ĐIỀU TRỊ KHÔNG?</p>
          {missingSections.includes('Section 8') && (
            <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full">Chưa trả lời</span>
          )}
        </div>
        <div className="p-6 flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s8?.includes('meds')} onChange={() => toggleCheckbox('s8', 'meds')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Có dùng thuốc (kháng sinh, giảm đau, Aspirin, Corticoid...)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s8?.includes('none')} onChange={() => toggleCheckbox('s8', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm font-bold leading-5">Không dùng thuốc nào</span>
            </label>
          </div>
          <div className="flex flex-col items-start gap-2 w-full mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s8?.includes('other')} onChange={() => toggleCheckbox('s8', 'other')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Thuốc/thực phẩm khác (ghi rõ)</span>
            </label>
            {answers.s8?.includes('other') && (
              <input type="text" value={answers.s8_note} onChange={(e) => setText('s8_note', e.target.value)} className="w-full py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none focus:border-[#3B82F6]" placeholder="Tên thuốc..." />
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex pt-6 justify-between items-center w-full">
        <button
          onClick={handleBack}
          className="cursor-pointer flex py-3.5 px-10 justify-center items-center gap-2 rounded-xl bg-[#1A1A2E] hover:bg-[#2C2C44] transition-colors w-fit text-white font-inter text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <button
          onClick={handleNext}
          className="cursor-pointer flex py-4 px-12 justify-center items-center gap-2 rounded-xl bg-[#93000B] hover:bg-[#7a0009] transition-colors w-fit text-white font-inter text-sm font-semibold shadow-[0_4px_6px_-1px_rgba(147,0,11,0.25)] active:scale-[0.98]"
        >
          Xác nhận thông tin
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <EligibilityOverlay
        isOpen={showEligibilityOverlay}
        onClose={() => setShowEligibilityOverlay(false)}
        title="Không đủ điều kiện hiến máu"
        message={eligibilityReason}
      />
    </div>
  );
};
