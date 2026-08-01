import React from 'react';
import { IconMapPin } from '../../../shared/components/Icons/IconMapPin';
import { IconTicket } from '../../../shared/components/Icons/IconTicket';
import { IconImpact } from '../../../shared/components/Icons/IconImpact';
import { IconRobot } from '../../../shared/components/Icons/IconRobot';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      id: '1',
      titleKey: 'Find Nearby Points',
      descriptionKey: 'Browse active donation campaigns on an interactive map and book your preferred time slots in just a few seconds.',
      icon: <IconMapPin />
    },
    {
      id: '2',
      titleKey: 'Instant E-Tickets',
      descriptionKey: 'Get your personalized appointment ticket with a secure QR code for instant check-in at any donation center.',
      icon: <IconTicket />
    },
    {
      id: '3',
      titleKey: 'Track Your Impact',
      descriptionKey: 'View your donation timeline, earn achievements, and track your donor level progression as you help save more lives.',
      icon: <IconImpact />
    },
    {
      id: '4',
      titleKey: 'AI-Powered Guidance',
      descriptionKey: 'Chat with our intelligent assistant for personalized donation prep, health advice, and post-donation recovery tips.',
      icon: <IconRobot />
    }
  ];

  return (
    <section className="w-full bg-white py-24 px-6 lg:px-12">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-16">
        <div className="text-center max-w-2xl flex flex-col gap-4">
          <h2 className="text-4xl font-bold text-gray-900">Why Donate with LifeLine?</h2>
          <p className="text-[#5B403D] text-base leading-relaxed">
            We use advanced technology to make the life-saving process of blood
            donation seamless, transparent, and rewarding for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {features.map(feature => (
            <div key={feature.id} className="bg-[#F8F9FA] border border-[#F1F3F5] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6">
              <div className="w-12 h-12 bg-[#FEE2E2] rounded-xl flex items-center justify-center text-[#93000B]">
                {feature.icon}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-gray-900">{feature.titleKey}</h3>
                <p className="text-[#5B403D] text-sm leading-relaxed">{feature.descriptionKey}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
