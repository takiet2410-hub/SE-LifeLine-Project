import React from 'react';
import { ValueCard } from './ValueCard';
import { IconReliability } from '../../../../shared/components/Icons/IconReliability';
import { IconHumanCentered } from '../../../../shared/components/Icons/IconHumanCentered';
import { IconInnovation } from '../../../../shared/components/Icons/IconInnovation';
import type { CoreValueProps } from '../../../../types/about';

const coreValues: CoreValueProps[] = [
  {
    id: 'reliability',
    title: 'Reliability',
    description: 'Medical-grade standards in everything we do. We prioritize safety and data integrity above all else.',
    icon: <IconReliability />
  },
  {
    id: 'humanCentered',
    title: 'Human-Centered',
    description: 'Designing for people, from donors to patients. We believe technology should serve human connections.',
    icon: <IconHumanCentered />
  },
  {
    id: 'innovation',
    title: 'Innovation',
    description: 'Using AI and data to speed up emergency responses. Modernizing logistics to save lives faster than ever.',
    icon: <IconInnovation />
  }
];

export const CoreValues: React.FC = () => {
  return (
    <section className="bg-white py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#2D3748]">
            Our Core Values
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {coreValues.map(value => (
            <ValueCard key={value.id} value={value} />
          ))}
        </div>
      </div>
    </section>
  );
};
