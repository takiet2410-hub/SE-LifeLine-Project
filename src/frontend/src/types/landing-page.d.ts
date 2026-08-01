import React from 'react';

export interface NavItemProps {
  labelKey: string;
  href: string;
}

export interface FeatureProps {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

export interface TestimonialProps {
  id: string;
  authorName: string;
  donorRoleKey: string;
  quoteKey: string;
  avatarUrl: string;
}
