import React from 'react';

export interface JourneyStepProps {
  id: string;
  stepNumber: string;
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
}

export interface EligibilityCriterionProps {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
}
