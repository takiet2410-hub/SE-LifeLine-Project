import React from 'react';

export interface ImpactStatProps {
  id: string;
  value: string;
  label: string;
  icon: React.ReactNode;
}

export interface CoreValueProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}
