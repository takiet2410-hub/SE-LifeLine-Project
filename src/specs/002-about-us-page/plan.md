# Implementation Plan: About Us Page

**Branch**: `[002-about-us-page]` | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-about-us-page/spec.md`

## Summary

Build the public-facing "About Us" page. This involves refactoring a monolithic Figma export into modular React (Vite) components, enforcing strict TypeScript, utilizing Tailwind CSS (eradicating absolute positioning), and integrating `i18next` for localization.

## 1. Architecture Overview

We will refactor the current monolithic, auto-generated Figma code into a modular React component tree. The core functional components to be extracted specifically for this page are:
- `<MissionSection />`: The top hero/mission statement area.
- `<ImpactStats />`: The "Difference We Make" section containing the 3 metric cards.
- `<OurStory />`: The history and origin text section.
- `<CoreValues />`: The "Our Core Values" section with 3 value cards.

We will reuse the existing global components: `<Header />` and `<Footer />`. The bottom CTA section will be extracted into a `<CallToAction />` component that can potentially be shared across public pages.

## 2. Technology Stack & Layout Refactoring Strategy

**Language/Version**: TypeScript (`strict: true`)
**Primary Dependencies**: React 18 (Vite), React Router DOM, Tailwind CSS, i18next

**Layout Refactoring Strategy**:
All hardcoded absolute positioning classes (e.g., `absolute left-[179px] top-[33px]`, `absolute left-0 top-[604px]`, fixed widths like `w-[395px] h-[190px]`) must be eradicated. 
Instead, we will use Tailwind Flexbox and Grid utilities:
- The `<ImpactStats />` and `<CoreValues />` will use a CSS Grid layout (e.g., `grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1280px] mx-auto`) to ensure responsiveness across mobile and desktop.
- Internal card layouts will use Flexbox (`flex flex-col items-center`, `justify-between`) to align text and icons dynamically.

## 3. Asset & State Management

The inline SVGs (like the active donors icon, partner hospitals icon, and core values icons) found in the monolithic code will be abstracted into reusable React components inside the `src/frontend/src/shared/components/Icons/` directory (e.g., `IconDonors.tsx`, `IconHospital.tsx`, `IconReliability.tsx`).

We will define TypeScript interfaces to pass dynamic data and prepare for i18next translation strings:
```typescript
export interface ImpactStatProps {
  id: string;
  value: string; // e.g., "50,000+"
  labelKey: string; // e.g., "about.stats.activeDonors"
  icon: React.ReactNode;
}

export interface CoreValueProps {
  id: string;
  titleKey: string; // e.g., "about.values.reliability.title"
  descriptionKey: string; // e.g., "about.values.reliability.desc"
  icon: React.ReactNode;
}
```

## 4. Implementation Sequence

- **Phase 1: Type definitions & Asset extraction**: Create the `ImpactStatProps` and `CoreValueProps` in a types file. Extract all inline SVGs from the monolithic code into `shared/components/Icons/`.
- **Phase 2: Building atomic UI components**: Build the reusable `<StatCard />` and `<ValueCard />` components that consume the props defined above.
- **Phase 3: Assembling page-level structural sections**: Build `<MissionSection />`, `<ImpactStats />`, `<OurStory />`, `<CoreValues />`, and `<CallToAction />` using responsive Flexbox/Grid layouts. Compose them inside `AboutUsPage.tsx`.
- **Phase 4: Integration of i18next and responsive testing**: Add translation keys to `en/landing.json` and `vi/landing.json`. Test the page rendering across mobile (375px), tablet (768px), and desktop (1280px) breakpoints to ensure the Flexbox/Grid layout behaves as expected.

## 5. Constitution Verification

*GATE: Passed*
- **Modular Monolith**: This component breakdown aligns with the isolated folder structure. The `AboutUsPage` and its specific sections will live inside `src/frontend/src/modules/landing-page/components/about/`. Shared assets like Icons will live in `shared/components/Icons/`. This supports our 5-person concurrent workflow by minimizing merge conflicts in `App.tsx` or shared UI boundaries.
- **TypeScript Strict Mode**: The use of explicitly typed props (`ImpactStatProps`, `CoreValueProps`) satisfies our strict TS requirements.

## 6. Assumptions & Open Questions

- **Routing Dependencies**: The Call-to-Action buttons ("Join Our Network", "Sign Up Now") assume that the `/register` or `/login` authentication flow is accessible. If `/register` doesn't exist yet, we will temporarily link to `/login` or `#` to prevent a hard crash.
- **Header State**: The active state highlighting in the `<Header />` will be based on React Router's `useLocation()` hook matching `/about`.

## Project Structure

```text
specs/002-about-us-page/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
└── tasks.md             
```

### Source Code

```text
frontend/
├── src/
│   ├── modules/
│   │   └── landing-page/
│   │       ├── components/
│   │       │   ├── about/
│   │       │   │   ├── MissionSection.tsx
│   │       │   │   ├── ImpactStats.tsx
│   │       │   │   ├── OurStory.tsx
│   │       │   │   └── CoreValues.tsx
│   │       │   └── CallToAction.tsx
│   │       └── pages/
│   │           └── AboutUsPage.tsx
│   ├── shared/
│   │   └── components/
│   │       └── Icons/
│   │           ├── IconDonors.tsx
│   │           ├── IconHospital.tsx
│   │           ├── IconHeart.tsx
│   │           ├── IconReliability.tsx
│   │           ├── IconHumanCentered.tsx
│   │           └── IconInnovation.tsx
│   ├── types/
│   │   └── about.ts
│   └── i18n/
│       └── locales/
│           ├── en/landing.json
│           └── vi/landing.json
```
