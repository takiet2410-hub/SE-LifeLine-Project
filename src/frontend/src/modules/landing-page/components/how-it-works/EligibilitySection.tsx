import React from 'react';
import { useTranslation } from 'react-i18next';
import { EligibilityCard } from './EligibilityCard';
import { IconAge } from '../../../../shared/components/Icons/IconAge';
import { IconWeight } from '../../../../shared/components/Icons/IconWeight';
import { IconHealth } from '../../../../shared/components/Icons/IconHealth';
import { IconInterval } from '../../../../shared/components/Icons/IconInterval';
import type { EligibilityCriterionProps } from '../../../../types/how-it-works';

export const EligibilitySection: React.FC = () => {
  const { t } = useTranslation('landing');

  const criteria: EligibilityCriterionProps[] = [
    {
      id: 'age',
      titleKey: 'howItWorks.eligibility.criteria.age.title',
      descKey: 'howItWorks.eligibility.criteria.age.desc',
      icon: <IconAge className="w-5 h-5" />,
    },
    {
      id: 'weight',
      titleKey: 'howItWorks.eligibility.criteria.weight.title',
      descKey: 'howItWorks.eligibility.criteria.weight.desc',
      icon: <IconWeight className="w-6 h-6" />,
    },
    {
      id: 'health',
      titleKey: 'howItWorks.eligibility.criteria.health.title',
      descKey: 'howItWorks.eligibility.criteria.health.desc',
      icon: <IconHealth className="w-6 h-6" />,
    },
    {
      id: 'interval',
      titleKey: 'howItWorks.eligibility.criteria.interval.title',
      descKey: 'howItWorks.eligibility.criteria.interval.desc',
      icon: <IconInterval className="w-6 h-6" />,
    },
  ];

  return (
    <section id="eligibility" className="flex pt-12 pb-20 px-6 lg:px-24 flex-col items-center bg-[#F8F9FA] w-full scroll-mt-24">
      <div className="flex max-w-[1280px] flex-col items-center gap-12 w-full">
        <div className="flex flex-col items-center gap-4 w-full max-w-[768px] text-center">
          <h2 className="text-[#271816] font-inter text-3xl font-bold leading-tight">
            {t('howItWorks.eligibility.title')}
          </h2>
          <p className="text-[#5B403D] font-inter text-base md:text-lg leading-6">
            Trước khi đặt lịch hẹn, hãy kiểm tra xem bạn có đáp ứng các tiêu chuẩn sức khỏe cơ bản theo quy định của Bộ Y Tế để tham gia hiến máu hay không.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {criteria.map((criterion) => (
            <EligibilityCard key={criterion.id} {...criterion} />
          ))}
        </div>
      </div>
    </section>
  );
};
