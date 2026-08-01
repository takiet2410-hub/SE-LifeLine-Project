import React from 'react';
import { Layout } from './components/Layout';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { TestimonialSection } from './components/TestimonialSection';
import { CTASection } from './components/CTASection';

export const LandingPage: React.FC = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <TestimonialSection />
      <CTASection />
    </Layout>
  );
};
