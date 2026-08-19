# Data Model: Landing Page & Global Navigation

This feature focuses on UI components and does not involve backend database models. The "data model" here refers to the TypeScript interface contracts passed as props to the React components to facilitate dynamic rendering and localization (i18next).

## Component Interfaces

```typescript
// src/frontend/src/types/landing-page.d.ts

export interface NavItemProps {
  labelKey: string; // i18next key, e.g., 'nav.aboutUs'
  href: string;     // Route path, e.g., '/about'
}

export interface FeatureProps {
  id: string;
  titleKey: string;       // e.g., 'features.findPoints.title'
  descriptionKey: string; // e.g., 'features.findPoints.desc'
  icon: React.ReactNode;  // JSX element from shared/components/Icons/
}

export interface TestimonialProps {
  id: string;
  authorName: string;
  donorRoleKey: string;   // e.g., 'roles.regularDonor'
  quoteKey: string;       // e.g., 'testimonials.hoangMinh.quote'
  avatarUrl: string;      // URL to Cloudinary image
}
```
