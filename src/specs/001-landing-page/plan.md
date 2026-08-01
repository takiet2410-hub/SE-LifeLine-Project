# Implementation Plan: Landing Page & Global Navigation

**Branch**: `[###-landing-page]` | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-landing-page/spec.md`

## Summary

Build the public-facing Landing Page and global navigation structure for the LifeLine platform by refactoring the monolithic, auto-generated Figma code into a modular React component tree. The approach eradicates absolute positioning in favor of responsive Tailwind Flexbox/Grid utilities and abstracts static content to prepare for i18next localization.

## Technical Context

**Language/Version**: TypeScript (`strict: true`)
**Primary Dependencies**: React (Vite), Tailwind CSS, React Router (Routing), i18next (Localization)
**Storage**: N/A (Frontend component state only)
**Testing**: Jest + React Testing Library (per Constitution)
**Target Platform**: Web Browser (Mobile, Tablet, Desktop)
**Project Type**: Web Application (Frontend SPA)
**Performance Goals**: Page load ≤ 3s (95% of requests)
**Constraints**: Zero absolute positioning (`top-[...]`, `left-[...]`), responsive on all standard viewports.
**Scale/Scope**: Single responsive landing page with multiple sections.

## Architecture Overview

**Strategy**: The provided monolithic reference code will be broken down into a modular React component tree. The monolithic structure relies heavily on absolute positioning which breaks responsive design. We will refactor this entirely using Tailwind's Flexbox and Grid utilities.

**Core Functional Components to Extract**:
1. `<Layout />`: Wraps the page, containing the Header and Footer.
2. `<Header />`: Global navigation (Links to About Us, Locations, Sign Up, Login, Language Toggle).
3. `<HeroSection />`: The main banner ("Every Drop Saves a Life") and primary CTAs.
4. `<FeaturesSection />`: The "Why Donate with LifeLine?" section detailing E-Tickets, AI, and Tracking.
5. `<TestimonialSection />`: Donor feedback carousel/cards ("What Our Donors Say").
6. `<CTASection />`: "Ready to Make a Difference?" banner.
7. `<Footer />`: Global footer with Quick Links and Resources.

## Technology Stack & Key Decisions

- **React (Vite) & TypeScript (`strict: true`)**: Enforced as per the Constitution and user request to catch type issues at compile-time and enable strict interfaces for localized text props.
- **Tailwind CSS (Responsive Refactoring Strategy)**: The auto-generated Figma code contains classes like `absolute`, `left-0`, `top-[661px]`, and `w-[1024px]`. These must be completely eradicated. The page will utilize standard responsive utility flows: `flex`, `flex-col`, `lg:flex-row`, `grid`, and `grid-cols-1 md:grid-cols-3` to ensure dynamic scaling from 320px up to large desktop screens.
- **Routing**: `react-router-dom` is assumed to handle linking the global navigation buttons to the respective views (`/login`, `/signup`, `/map`).

## Asset & State Management

**Icon Abstraction**:
All inline SVGs from the monolithic code (e.g., checkmarks, map pin, robot icon) will be extracted into a dedicated `src/frontend/src/shared/components/Icons/` directory. Each icon will be a separate, reusable React functional component (e.g., `<IconMapPin />`, `<IconRobot />`).

**TypeScript Interfaces (Preparing for i18next)**:
To prepare the components for localization, hardcoded strings will be replaced with dynamic props.
Example Interfaces:
```typescript
interface FeatureCardProps {
  id: string;
  titleKey: string; // Key for i18next
  descriptionKey: string;
  icon: React.ReactNode;
}

interface TestimonialCardProps {
  id: string;
  authorName: string;
  donorRoleKey: string; // e.g., 'roles.studentVolunteer'
  quoteKey: string;
  avatarUrl: string;
}
```

## Implementation Sequence

- **Phase 1: Type Definitions, Assets, and Setup**
  - Extract all inline SVGs into `shared/components/Icons/`.
  - Define TypeScript interfaces in `types/` for the component props.
  - Set up `react-router-dom` stubs for navigation links.

- **Phase 2: Structural Layout Components**
  - Implement `<Header />` and `<Footer />` components using Flexbox for global navigation.
  - Implement the `<Layout />` wrapper.

- **Phase 3: Page Section Components**
  - Build `<HeroSection />`, `<FeaturesSection />`, `<TestimonialSection />`, and `<CTASection />`.
  - Migrate content from the monolithic code, ripping out all absolute positioning and hardcoded dimensions.

- **Phase 4: Responsive Styling & Integration**
  - Apply Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
  - Verify layout integrity across mobile, tablet, and desktop viewports.
  - Wire up the language toggle to `i18next`.

## Constitution Verification

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
- **TypeScript strict mode**: Verified (explicitly included).
- **Module Boundaries**: Verified. The components will live under `src/frontend/src/shared/components` (for globally reusable items like Header/Footer/Icons) and `src/frontend/src/modules/landing-page/` for page-specific sections. This aligns with the 5-person concurrent workflow, isolating the Landing Page FG (Functional Group) from other teams.
- **Styling**: Tailwind CSS is used correctly; eliminating absolute positioning conforms to standard best practices for responsive web apps (NFR-U-01).

## Assumptions & Open Questions

- **Dependencies**: It is assumed that `react-router-dom` is the standard routing library for the SPA.
- **i18next Setup**: It is assumed `i18next` and `react-i18next` are already installed or will be configured globally at the `App.tsx` level; this feature will just wire up the `useTranslation()` hook.

## Project Structure

### Documentation (this feature)

```text
specs/001-landing-page/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── frontend/
    └── src/
        ├── modules/
        │   └── landing-page/
        │       ├── components/
        │       │   ├── HeroSection.tsx
        │       │   ├── FeaturesSection.tsx
        │       │   ├── TestimonialSection.tsx
        │       │   └── CTASection.tsx
        │       └── LandingPage.tsx
        └── shared/
            └── components/
                ├── Header.tsx
                ├── Footer.tsx
                └── Icons/
                    ├── IconMapPin.tsx
                    ├── IconTicket.tsx
                    ├── IconRobot.tsx
                    └── ...
```

**Structure Decision**: The frontend component breakdown aligns precisely with the Constitution's `frontend/src/modules/` and `frontend/src/shared/` split, keeping the landing page isolated from core backend logic.
