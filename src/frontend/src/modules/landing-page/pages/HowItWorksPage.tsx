import React from 'react';
import { Layout } from '../components/Layout';
import { HowItWorksHero } from '../components/how-it-works/HowItWorksHero';
import { JourneySteps } from '../components/how-it-works/JourneySteps';
import { EligibilitySection } from '../components/how-it-works/EligibilitySection';
import { CallToAction } from '../components/CallToAction';

export const HowItWorksPage: React.FC = () => {
  return (
    <Layout>
      <main className="w-full">
        <HowItWorksHero />
        <JourneySteps />
        <EligibilitySection />
        <CallToAction />
      </main>
    </Layout>
  );
};
