import React from 'react';
import { Layout } from '../components/Layout';
import { MissionSection } from '../components/about/MissionSection';
import { ImpactStats } from '../components/about/ImpactStats';
import { OurStory } from '../components/about/OurStory';
import { CoreValues } from '../components/about/CoreValues';
import { CallToAction } from '../components/CallToAction';

export const AboutUsPage: React.FC = () => {
  return (
    <Layout>
      <main className="w-full">
        <MissionSection />
        <ImpactStats />
        <OurStory />
        <CoreValues />
        <CallToAction />
      </main>
    </Layout>
  );
};
