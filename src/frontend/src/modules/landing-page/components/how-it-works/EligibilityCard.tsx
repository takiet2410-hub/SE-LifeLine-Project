import React from 'react';
import { useTranslation } from 'react-i18next';
import type { EligibilityCriterionProps } from '../../../../types/how-it-works';

export const EligibilityCard: React.FC<EligibilityCriterionProps> = ({ titleKey, descKey, icon }) => {
  const { t } = useTranslation('landing');

  return (
    <div className="flex p-6 flex-col items-center rounded-2xl border border-[#E4BEB9] bg-[#FFF] shadow-sm hover:shadow-md transition-shadow w-full">
      <div className="flex pb-4 flex-col items-center w-16 h-20">
        <div className="flex justify-center items-center shrink-0 rounded-full bg-[#FFE2DE] w-16 h-16 text-[#93000B]">
          {icon}
        </div>
      </div>
      <div className="flex pb-1 flex-col items-center w-full">
        <h3 className="text-[#271816] font-inter text-lg font-bold leading-6 text-center">
          {t(titleKey)}
        </h3>
      </div>
      <div className="flex px-2.5 flex-col items-center w-full mt-2">
        <p className="text-[#5B403D] font-inter text-base leading-6 text-center">
          {t(descKey)}
        </p>
      </div>
    </div>
  );
};
