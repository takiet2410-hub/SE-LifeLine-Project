# Implementation Plan: How It Works Page

**Branch**: `003-how-it-works-page` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-how-it-works-page/spec.md`

## Summary

This plan outlines the technical refactoring strategy for transforming the monolithic Figma-generated "How It Works" layout into modular, reusable, and responsive React components. It adheres strictly to the project's TypeScript, Tailwind CSS, and i18next guidelines.

## 1. Architecture Overview

The current monolithic Figma code will be refactored into a modular React component tree within the `src/frontend/src/modules/landing-page/` module boundary.

Core functional components to be extracted:
- `<HowItWorksPage />`: The main page component wrapping the sections.
- `<JourneySteps />`: Container for the journey process.
- `<StepCard />`: Atomic component for an individual step (Registration, Donation, Recovery, Track Impact).
- `<EligibilitySection />`: Container for eligibility criteria.
- `<EligibilityCard />`: Atomic component for an eligibility criterion (Age, Weight, Health Status, Interval).
- `<CallToAction />`: Reusable CTA section (can potentially be shared with About Us page).

## 2. Technology Stack & Layout Refactoring Strategy

- **Language**: TypeScript (`strict: true`) to enforce robust type-safety on all component props.
- **Framework**: React via Vite.
- **Styling**: Tailwind CSS exclusively.
- **Eradication of Figma Code**: All hardcoded absolute positioning classes (e.g., `absolute left-[560px] top-[294px]`, `absolute left-0 top-[294px]`) will be systematically removed.
- **Fluid Responsiveness**: Tailwind CSS Grid (e.g., `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) will be used to dynamically align the 4 Journey Steps and 4 Eligibility criteria cards, ensuring they adapt gracefully to all screen sizes without overflow.

## 3. Asset & Data Management

- **Asset Abstraction**: The inline SVGs (the pink icons for each step and eligibility requirement) will be abstracted into reusable React components inside the `src/frontend/src/shared/components/Icons/` directory (e.g., `IconRegistration`, `IconAge`, etc.).
- **Data Mapping & i18next**: Data arrays will be used to map over the cards. The data arrays will reference translation keys rather than hardcoded text, allowing `i18next` to dynamically swap English and Vietnamese content.
- **TypeScript Interfaces**:
  - `JourneyStepProps`: `{ id: string; stepNumber: string; titleKey: string; descKey: string; icon: React.ReactNode; }`
  - `EligibilityCriterionProps`: `{ id: string; titleKey: string; descKey: string; icon: React.ReactNode; }`

## 4. Implementation Sequence

- **Phase 1 (Foundation)**: Define TypeScript interfaces (`src/frontend/src/types/how-it-works.ts`), configure `i18n` JSON files, and extract all SVG icons into `src/frontend/src/shared/components/Icons/`.
- **Phase 2 (Atomic Components)**: Build the `StepCard` and `EligibilityCard` atomic components.
- **Phase 3 (Assembly)**: Build the `JourneySteps` and `EligibilitySection` page-level structural sections using responsive Tailwind Grid/Flexbox layouts. Assemble these inside `HowItWorksPage.tsx`.
- **Phase 4 (Integration & Testing)**: Integrate i18next keys for the text (handling both English and Vietnamese properly), execute Vite build tests for TypeScript strict validation, and perform responsive layout testing.

## 5. Constitution Verification

*GATE: Passed*

- **Modular Folder Structure**: The components will be placed within a dedicated module folder (`src/frontend/src/modules/landing-page/components/how-it-works/`). This prevents cross-module pollution and supports the 5-person concurrent workflow by isolating changes to a specific feature domain, minimizing merge conflicts.
- **TypeScript Strict**: Enforced via types and TS config constraints.
- **Routing Boundaries**: Navigational components (e.g., Header) correctly reflect the active route.

## 6. Assumptions & Open Questions

- **Authentication Module Dependency**: The "Sign Up Now" CTA button relies on the existence of a valid `/register` route provided by the Auth module. We assume this route is active and handled correctly by `react-router-dom`.
- **Global Header**: We assume the global `<Header />` handles the `useLocation()` hook correctly to render the bottom border for the active `/how-it-works` path, as recently updated.

## Project Structure

### Documentation (this feature)

```text
specs/003-how-it-works-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty/not needed for pure UI)
└── quickstart.md        # Phase 1 output
```

### Source Code

```text
src/frontend/src/
├── types/
│   └── how-it-works.ts
├── shared/components/Icons/
│   ├── IconRegistration.tsx
│   ├── IconDonation.tsx
│   ├── IconRecovery.tsx
│   ├── IconTrack.tsx
│   ├── IconAge.tsx
│   ├── IconWeight.tsx
│   ├── IconHealth.tsx
│   └── IconInterval.tsx
├── modules/landing-page/
│   ├── components/how-it-works/
│   │   ├── JourneySteps.tsx
│   │   ├── StepCard.tsx
│   │   ├── EligibilitySection.tsx
│   │   └── EligibilityCard.tsx
│   └── pages/
│       └── HowItWorksPage.tsx
└── i18n/locales/
    ├── en/landing.json
    └── vi/landing.json
```
