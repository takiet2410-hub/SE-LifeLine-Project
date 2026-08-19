import React from 'react';
import { useTranslation } from 'react-i18next';
import type { JourneyStepProps } from '../../../../types/how-it-works';

export const StepCard: React.FC<JourneyStepProps> = ({ stepNumber, titleKey, descKey, icon }) => {
  const { t } = useTranslation('landing');

  return (
    <div className="flex p-6 flex-col items-start rounded-2xl border border-[#E4BEB9] w-full bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-6 w-full flex-col sm:flex-row">
        <div className="flex pt-4 pr-4 pb-[22px] pl-4 flex-col items-start rounded-xl bg-[#FFDAD6] w-fit shrink-0">
          {icon}
        </div>
        <div className="flex flex-col items-start gap-1 w-full">
          <div className="flex flex-col items-start w-full">
            <p className="text-[#93000B] font-inter text-base font-bold leading-6 w-fit">
              Step {stepNumber}
            </p>
          </div>
          <div className="flex flex-col items-start w-full">
            <p className="text-[#271816] font-inter text-lg font-semibold leading-6 w-fit">
              {t(titleKey)}
            </p>
          </div>
          <div className="flex pt-3 flex-col items-start w-full">
            <p className="text-[#5B403D] font-inter text-base leading-6 w-full">
              {t(descKey)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
