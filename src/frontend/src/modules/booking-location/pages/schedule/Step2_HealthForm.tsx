import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import { Activity, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

const healthQuestions = [
  { id: 'q1', text: 'Are you feeling well and healthy today?' },
  { id: 'q2', text: 'Have you had a tattoo or piercing in the last 6 months?' },
  { id: 'q3', text: 'Have you taken any antibiotics in the last 7 days?' },
  { id: 'q4', text: 'Are you currently pregnant or breastfeeding?' },
  { id: 'q5', text: 'Have you tested positive for HIV, Hepatitis B or C?' },
];

export const Step2_HealthForm: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useScheduleContext();
  const [answers, setAnswers] = useState<Record<string, boolean>>(data.healthAnswers || {});

  const handleToggle = (id: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleNext = () => {
    updateData({ healthAnswers: answers });
    navigate('/my-appointments/schedule/step-3');
  };

  // Ensure all questions are answered
  const isFormComplete = healthQuestions.every(q => answers[q.id] !== undefined);

  return (
    <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
      <div className="bg-[#fff8f7] border border-[#f1f3f5] rounded-xl p-6 shadow-sm mb-2">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-[#93000b] shrink-0" />
          <div>
            <h3 className="text-[16px] font-bold text-[#93000b] mb-1">Pre-Donation Screening</h3>
            <p className="text-[13px] text-[#5b403d] leading-relaxed">
              Your honest answers ensure the safety of both you and the recipient. All information is kept strictly confidential.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#f1f3f5] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#f1f3f5] bg-[#f8f9fa] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#93000b]" />
          <h2 className="text-[16px] font-bold text-[#271816]">Health Questionnaire</h2>
        </div>
        
        <div className="flex flex-col">
          {healthQuestions.map((q, index) => (
            <div key={q.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${index !== healthQuestions.length - 1 ? 'border-b border-[#f1f3f5]' : ''}`}>
              <span className="text-[14px] font-medium text-[#271816] flex-1">
                {q.text}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleToggle(q.id, true)}
                  className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all border ${
                    answers[q.id] === true 
                      ? 'bg-[#93000b] text-white border-[#93000b]' 
                      : 'bg-white text-[#6c757d] border-[#dee2e6] hover:border-[#a3a3a3]'
                  }`}
                >
                  YES
                </button>
                <button
                  onClick={() => handleToggle(q.id, false)}
                  className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all border ${
                    answers[q.id] === false 
                      ? 'bg-[#271816] text-white border-[#271816]' 
                      : 'bg-white text-[#6c757d] border-[#dee2e6] hover:border-[#a3a3a3]'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => navigate('/my-appointments/schedule')}
          className="flex items-center gap-2 px-6 py-3 border border-[#dee2e6] text-[#271816] hover:bg-[#f8f9fa] text-[15px] font-semibold rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!isFormComplete}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-[15px] font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review & Confirm
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
