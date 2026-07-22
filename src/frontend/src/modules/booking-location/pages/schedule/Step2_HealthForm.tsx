import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const Step2_HealthForm: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useScheduleContext();
  
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

  const handleNext = () => {
    updateData({ healthAnswers: answers });
    navigate('/my-appointments/schedule/step-3');
  };

  const handleBack = () => {
    // Save state before going back
    updateData({ healthAnswers: answers });
    navigate('/my-appointments/schedule/step-1');
  };

  // Helper for radio buttons
  const setRadio = (key: string, val: string) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  // Helper for text inputs
  const setText = (key: string, val: string) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  // Helper for checkboxes (allows multiple, handles "none" exclusively)
  const toggleCheckbox = (key: string, val: string, isExclusiveNone = false) => {
    setAnswers(prev => {
      let currentArr = prev[key] || [];
      if (isExclusiveNone) {
        if (currentArr.includes(val)) return { ...prev, [key]: [] };
        return { ...prev, [key]: [val] };
      } else {
        // If they click a normal option, remove 'none'
        currentArr = currentArr.filter((item: string) => item !== 'none');
        if (currentArr.includes(val)) {
          return { ...prev, [key]: currentArr.filter((item: string) => item !== val) };
        } else {
          return { ...prev, [key]: [...currentArr, val] };
        }
      }
    });
  };

  const isFormComplete = () => {
    if (!answers.s1) return false;
    
    if (!answers.s2) return false;
    if (answers.s2 === 'yes' && (!answers.s2_note || answers.s2_note.trim() === '')) return false;

    if (!answers.s3) return false;
    if (answers.s3 === 'other' && (!answers.s3_note || answers.s3_note.trim() === '')) return false;

    if (!answers.s4 || answers.s4.length === 0) return false;
    if (!answers.s5 || answers.s5.length === 0) return false;
    if (!answers.s6 || answers.s6.length === 0) return false;
    
    if (!answers.s7 || answers.s7.length === 0) return false;
    if (answers.s7.includes('other') && (!answers.s7_note || answers.s7_note.trim() === '')) return false;

    if (!answers.s8 || answers.s8.length === 0) return false;
    if (answers.s8.includes('other') && (!answers.s8_note || answers.s8_note.trim() === '')) return false;

    return true;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[956px] mx-auto">
      
      {/* SECTION 1 */}
      <div className="flex pb-6 flex-col items-center gap-6 rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <div className="flex py-3 px-6 flex-col items-start bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 w-full tracking-[0.025em]">SECTION 1: HAVE YOU EVER DONATED BLOOD BEFORE?</p>
        </div>
        <div className="flex items-center gap-8 w-full px-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={answers.s1 === 'yes'} onChange={() => setRadio('s1', 'yes')} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-base font-medium leading-6">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={answers.s1 === 'no'} onChange={() => setRadio('s1', 'no')} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-base font-medium leading-6">No</span>
          </label>
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <div className="flex py-3 px-6 flex-col items-start bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 w-full tracking-[0.025em]">SECTION 2: DO YOU CURRENTLY HAVE ANY MEDICAL CONDITIONS?</p>
        </div>
        <div className="flex p-6 flex-col items-start gap-4 w-full">
          <div className="flex items-center gap-8 w-full">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s2 === 'yes'} onChange={() => setRadio('s2', 'yes')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s2 === 'no'} onChange={() => setRadio('s2', 'no')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">No</span>
            </label>
          </div>
          {answers.s2 === 'yes' && (
            <div className="flex flex-col items-start gap-1 w-full">
              <p className="text-[#6C757D] font-inter text-xs leading-4">Please specify (if any):</p>
              <input type="text" value={answers.s2_note} onChange={(e) => setText('s2_note', e.target.value)} className="w-full max-w-[448px] py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none" placeholder="_______" />
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 */}
      <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <div className="flex py-3 px-6 flex-col items-start bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 w-full tracking-[0.025em]">SECTION 3: HAVE YOU EVER HAD ANY OF THE FOLLOWING: HEPATITIS B, C, HIV, ETC.</p>
        </div>
        <div className="flex p-6 flex-col items-start gap-4 w-full">
          <div className="flex items-center gap-8 w-full">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s3 === 'yes'} onChange={() => setRadio('s3', 'yes')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s3 === 'no'} onChange={() => setRadio('s3', 'no')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={answers.s3 === 'other'} onChange={() => setRadio('s3', 'other')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-base font-medium leading-6">Other conditions</span>
            </label>
          </div>
          {answers.s3 === 'other' && (
            <input type="text" value={answers.s3_note} onChange={(e) => setText('s3_note', e.target.value)} className="w-full py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none" placeholder="Details of other condition..." />
          )}
        </div>
      </div>

      {/* SECTION 4 */}
      <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <div className="flex py-3 px-6 flex-col items-start bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 w-full tracking-[0.025em]">SECTION 4: IN THE LAST 12 MONTHS, HAVE YOU:</p>
        </div>
        <div className="flex p-6 flex-col items-start gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <label className="flex p-3 items-center gap-3 rounded-lg border border-[#F1F3F5] w-full cursor-pointer">
              <input type="checkbox" checked={answers.s4?.includes('recovered')} onChange={() => toggleCheckbox('s4', 'recovered')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Recovered from illnesses (malaria, syphilis, tuberculosis, encephalitis, tetanus, surgery...)</span>
            </label>
            <label className="flex p-3 items-center gap-3 rounded-lg border border-[#F1F3F5] w-full cursor-pointer">
              <input type="checkbox" checked={answers.s4?.includes('blood')} onChange={() => toggleCheckbox('s4', 'blood')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Received a blood transfusion</span>
            </label>
            <label className="flex p-3 items-center gap-3 rounded-lg border border-[#F1F3F5] w-full cursor-pointer">
              <input type="checkbox" checked={answers.s4?.includes('vaccine')} onChange={() => toggleCheckbox('s4', 'vaccine')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Received a vaccination</span>
            </label>
            <label className="flex p-3 items-center gap-3 rounded-lg border border-[#F1F3F5] w-full cursor-pointer">
              <input type="checkbox" checked={answers.s4?.includes('none')} onChange={() => toggleCheckbox('s4', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm font-bold leading-5">None of the above</span>
            </label>
          </div>
          <div className="flex flex-col items-start gap-1 w-full mt-2">
            <p className="text-[#6C757D] font-inter text-xs leading-4">Additional notes:</p>
            <textarea value={answers.s4_note} onChange={(e) => setText('s4_note', e.target.value)} className="w-full h-[58px] py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none resize-none"></textarea>
          </div>
        </div>
      </div>

      {/* SECTION 5 */}
      <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <div className="flex py-3 px-6 flex-col items-start bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 w-full tracking-[0.025em]">SECTION 5: IN THE LAST 6 MONTHS, HAVE YOU:</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 w-full">
          {[
            { id: 'recovered', label: 'Recovered from illnesses (typhoid, blood infection, lice bite, vascular inflammation...)' },
            { id: 'weightloss', label: 'Experienced rapid weight loss' },
            { id: 'lymph', label: 'Had swollen lymph nodes' },
            { id: 'invasive', label: 'Undergone invasive medical procedures (dentistry, acupuncture...)' },
            { id: 'tattoo', label: 'Had a tattoo or ear/nose piercing' },
            { id: 'drugs', label: 'Used recreational drugs' },
            { id: 'contact', label: 'Had direct contact with blood/body fluids' },
            { id: 'livewith', label: 'Lived with someone infected with Hepatitis B' },
            { id: 'sex', label: 'Had unprotected sex (HBV, HCV, HIV, Syphilis)' },
            { id: 'samesex', label: 'Had same-sex relations' },
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s5?.includes(opt.id)} onChange={() => toggleCheckbox('s5', opt.id)} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">{opt.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer mt-2">
            <input type="checkbox" checked={answers.s5?.includes('none')} onChange={() => toggleCheckbox('s5', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-sm font-bold leading-5">None of the above</span>
          </label>
        </div>
      </div>

      {/* SECTION 6 */}
      <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <div className="flex py-3 px-6 flex-col items-start bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 w-full tracking-[0.025em]">SECTION 6: IN THE LAST 1 MONTH, HAVE YOU:</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 w-full">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={answers.s6?.includes('recovered')} onChange={() => toggleCheckbox('s6', 'recovered')} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-sm leading-5">Recovered from illnesses (urinary infection, pneumonia, sore throat, fever, dengue, Rubella...)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={answers.s6?.includes('epidemic')} onChange={() => toggleCheckbox('s6', 'epidemic')} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-sm leading-5">Traveled to an epidemic area (malaria, Zika...)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer mt-2">
            <input type="checkbox" checked={answers.s6?.includes('none')} onChange={() => toggleCheckbox('s6', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
            <span className="text-[#271816] font-inter text-sm font-bold leading-5">None of the above</span>
          </label>
        </div>
      </div>

      {/* SECTION 7 */}
      <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <div className="flex py-3 px-6 flex-col items-start bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 w-full tracking-[0.025em]">SECTION 7: IN THE LAST 14 DAYS, HAVE YOU:</p>
        </div>
        <div className="p-6 flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s7?.includes('flu')} onChange={() => toggleCheckbox('s7', 'flu')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Had flu, cold, cough, headache, fever, sore throat?</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s7?.includes('none')} onChange={() => toggleCheckbox('s7', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm font-bold leading-5">None of the above</span>
            </label>
          </div>
          <div className="flex flex-col items-start gap-2 w-full mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s7?.includes('other')} onChange={() => toggleCheckbox('s7', 'other')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Other (specify)</span>
            </label>
            {answers.s7?.includes('other') && (
              <input type="text" value={answers.s7_note} onChange={(e) => setText('s7_note', e.target.value)} className="w-full py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none" placeholder="Please specify..." />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 8 */}
      <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-[#FFF] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <div className="flex py-3 px-6 flex-col items-start bg-[#3B82F6] w-full">
          <p className="text-[#FFF] font-inter text-sm font-bold leading-5 w-full tracking-[0.025em]">SECTION 8: IN THE LAST 7 DAYS, HAVE YOU:</p>
        </div>
        <div className="p-6 flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s8?.includes('meds')} onChange={() => toggleCheckbox('s8', 'meds')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Taken medication (antibiotics, anti-inflammatory, Aspirin, Corticoid)?</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s8?.includes('none')} onChange={() => toggleCheckbox('s8', 'none', true)} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm font-bold leading-5">None of the above</span>
            </label>
          </div>
          <div className="flex flex-col items-start gap-2 w-full mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={answers.s8?.includes('other')} onChange={() => toggleCheckbox('s8', 'other')} className="w-5 h-5 accent-[#3B82F6]" />
              <span className="text-[#271816] font-inter text-sm leading-5">Other (specify)</span>
            </label>
            {answers.s8?.includes('other') && (
              <input type="text" value={answers.s8_note} onChange={(e) => setText('s8_note', e.target.value)} className="w-full py-2 px-3 rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] text-[#271816] font-inter text-sm outline-none" placeholder="Please specify..." />
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
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isFormComplete()}
          className="cursor-pointer flex py-4 px-12 justify-center items-center gap-2 rounded-xl bg-[#93000B] hover:bg-[#7a0009] transition-colors w-fit text-white font-inter text-sm font-semibold shadow-[0_4px_6px_-1px_rgba(147,0,11,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review Summary
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
