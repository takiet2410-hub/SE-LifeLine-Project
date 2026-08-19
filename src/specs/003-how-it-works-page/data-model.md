# Data Model: How It Works Page

This document defines the static UI data structures and TypeScript interfaces needed for the How It Works page. Since this is a pure frontend layout refactoring task with no backend API integration, the "entities" here are strictly component prop contracts used for iterating over mapped arrays to render UI cards.

## Component Interfaces

### 1. JourneyStepProps

Used to type the objects passed into the `<StepCard />` component.

```typescript
export interface JourneyStepProps {
  id: string;              // Unique identifier (e.g., 'registration')
  stepNumber: string;      // The visual step number (e.g., '01', '02')
  titleKey: string;        // i18next key for the step title
  descKey: string;         // i18next key for the step description
  icon: React.ReactNode;   // Rendered SVG icon component
}
```

### 2. EligibilityCriterionProps

Used to type the objects passed into the `<EligibilityCard />` component.

```typescript
export interface EligibilityCriterionProps {
  id: string;              // Unique identifier (e.g., 'age')
  titleKey: string;        // i18next key for the criterion title
  descKey: string;         // i18next key for the criterion description
  icon: React.ReactNode;   // Rendered SVG icon component
}
```

## Localization Structure (i18next)

The `landing.json` file in both `en` and `vi` locales will be extended to include these keys under the `howItWorks` namespace:

```json
{
  "howItWorks": {
    "journey": {
      "title": "Your Journey to Saving Lives",
      "steps": {
        "registration": {
          "title": "Registration & Screening",
          "desc": "..."
        },
        // ...
      }
    },
    "eligibility": {
      "title": "Are You Eligible to Donate?",
      "criteria": {
        "age": {
          "title": "Age & ID",
          "desc": "..."
        },
        // ...
      }
    }
  }
}
```
