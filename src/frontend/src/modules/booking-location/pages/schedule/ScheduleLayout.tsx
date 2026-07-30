import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export const ScheduleLayout: React.FC = () => {
  const location = useLocation();

  // Determine current step (1, 2, 3) from pathname
  const path = location.pathname;
  let currentStep = 1;
  if (path.includes('/step-2')) currentStep = 2;
  if (path.includes('/step-3')) currentStep = 3;
  if (path.includes('/success')) currentStep = 4; // Hide stepper on success

  const renderStepper = () => {
    if (currentStep === 4) return null;

    return (
      <div className="flex items-center justify-center mb-8 relative w-full max-w-[600px] mx-auto mt-4">
        {/* Horizontal Divider Line */}
        <div className="absolute top-4 left-[15%] right-[15%] h-[2px] bg-[#dee2e6] z-0" />
        
        <div className="flex justify-between w-full relative z-10">
          {[1, 2, 3].map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <div key={step} className="flex flex-col items-center gap-2 bg-[#fff8f7] px-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold transition-colors ${
                  isActive || isCompleted ? 'bg-[#93000b] text-white' : 'bg-[#e9ecef] text-[#a3a3a3]'
                }`}>
                  {step}
                </div>
                <span className={`text-[12px] font-semibold ${
                  isActive || isCompleted ? 'text-[#271816]' : 'text-[#a3a3a3]'
                }`}>
                  {step === 1 ? 'Location & Time' : step === 2 ? 'Health Screen' : 'Summary'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative p-6 md:p-8 max-w-[1000px] mx-auto w-full">
      {/* Stepper */}
      {renderStepper()}

      {/* Outlet for Step Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};
