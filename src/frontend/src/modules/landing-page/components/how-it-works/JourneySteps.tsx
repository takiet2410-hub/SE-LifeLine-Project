import React from 'react';
import { useTranslation } from 'react-i18next';
import { StepCard } from './StepCard';
import { IconRegistration } from '../../../../shared/components/Icons/IconRegistration';
import { IconDonation } from '../../../../shared/components/Icons/IconDonation';
import { IconRecovery } from '../../../../shared/components/Icons/IconRecovery';
import { IconTrack } from '../../../../shared/components/Icons/IconTrack';
import type { JourneyStepProps } from '../../../../types/how-it-works';

export const JourneySteps: React.FC = () => {
  const { t } = useTranslation('landing');

  const steps: JourneyStepProps[] = [
    {
      id: 'registration',
      stepNumber: '01',
      titleKey: 'howItWorks.journey.steps.registration.title',
      descKey: 'howItWorks.journey.steps.registration.desc',
      icon: <IconRegistration />,
    },
    {
      id: 'donation',
      stepNumber: '02',
      titleKey: 'howItWorks.journey.steps.donation.title',
      descKey: 'howItWorks.journey.steps.donation.desc',
      icon: <IconDonation />,
    },
    {
      id: 'recovery',
      stepNumber: '03',
      titleKey: 'howItWorks.journey.steps.recovery.title',
      descKey: 'howItWorks.journey.steps.recovery.desc',
      icon: <IconRecovery />,
    },
    {
      id: 'track',
      stepNumber: '04',
      titleKey: 'howItWorks.journey.steps.track.title',
      descKey: 'howItWorks.journey.steps.track.desc',
      icon: <IconTrack />,
    },
  ];

  return (
    <section className="flex py-12 px-6 lg:px-24 flex-col items-center bg-[#FFF] w-full">
      <div className="flex max-w-[1280px] flex-col items-center gap-12 w-full">
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex flex-col items-center w-full">
            <h2 className="text-[#271816] font-inter text-3xl font-bold leading-[1.2] text-center">
              {t('howItWorks.journey.title')}
            </h2>
          </div>
          <div className="rounded-full bg-[#93000B] w-24 h-1.5 mt-2"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full relative">
          {/* We replace the hardcoded absolute positioning with a responsive grid */}
          {steps.map((step) => (
            <StepCard key={step.id} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
};
