import React from 'react';
import { useTranslation } from 'react-i18next';

export const HowItWorksHero: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <div className="flex pt-16 flex-col items-start w-full">
      <div className="flex min-h-[716px] py-[171px] px-0 justify-center items-center bg-[#FFF0EE] w-full overflow-hidden relative">
        <div className="flex flex-col justify-center items-start absolute right-0 w-full md:w-[640px] h-[716px] opacity-20 md:opacity-100 z-0">
          <img
            src="/assets/Background.png"
            className="flex flex-col justify-center items-start md:rounded-[64px] w-full h-full object-cover"
            alt="Hero Background"
          />
        </div>
        <div className="grid max-w-[1280px] py-12 px-6 lg:px-24 w-full relative z-10">
          <div className="flex max-w-[672px] pb-8 flex-col items-start gap-2 w-full">
            <div className="flex flex-col items-start w-full">
              <p className="text-[#93000B] font-inter text-base font-bold leading-6 w-full tracking-[0.1em]">
                {t('about.mission.badge', 'OUR MISSION')}
              </p>
            </div>
            <div className="flex flex-col items-start w-full">
              <h1 className="text-[#93000B] font-inter text-4xl md:text-5xl font-bold leading-tight md:leading-[60px] w-full">
                How Blood Donation Saves Lives
              </h1>
            </div>
            <div className="flex max-w-[672px] pt-2 flex-col items-start w-full">
              <p className="text-[#4B5563] font-inter text-base md:text-lg leading-[26px] md:leading-[28px] w-full">
                Discover the simple blood donation process and how LifeLine makes it a safer, more convenient experience for everyone in Vietnam. Every drop counts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
