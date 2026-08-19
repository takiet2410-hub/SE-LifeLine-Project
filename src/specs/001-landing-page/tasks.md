---
description: "Task list template for feature implementation"
---

# Tasks: Landing Page & Global Navigation

**Input**: Design documents from `/specs/001-landing-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure for the landing page module under `src/frontend/src/modules/landing-page/components/`
- [X] T002 [P] Define TypeScript interfaces in `src/frontend/src/types/landing-page.d.ts` as specified in data-model.md
- [X] T003 [P] Extract all inline SVGs into reusable React components in `src/frontend/src/shared/components/Icons/` (e.g., `IconMapPin.tsx`, `IconTicket.tsx`, `IconRobot.tsx`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Setup `react-router-dom` stubs for navigation links in `src/frontend/src/App.tsx` (ensure Router wrapper is present and paths exist)
- [X] T005 Implement the Layout wrapper component in `src/frontend/src/modules/landing-page/components/Layout.tsx`
- [X] T006 Initialize the main page container in `src/frontend/src/modules/landing-page/LandingPage.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Navigate to Authentication and Core Features (Priority: P1) 🎯 MVP

**Goal**: As a visitor, I want to easily find links to login, sign up, or explore donation locations from the global navigation.

**Independent Test**: Can be tested independently by loading the landing page and verifying all links in the header correctly route to the intended authentication or informational pages.

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement `<Header />` component in `src/frontend/src/shared/components/Header.tsx` using responsive Tailwind flexbox utilities.
- [X] T008 [P] [US1] Implement `<Footer />` component in `src/frontend/src/shared/components/Footer.tsx` using responsive Tailwind grid and flexbox utilities.
- [X] T009 [US1] Integrate `<Header />` and `<Footer />` into the main layout inside `src/frontend/src/modules/landing-page/components/Layout.tsx`
- [X] T010 [US1] Add responsive utility classes (e.g., mobile hamburger menu logic) to `<Header />` in `src/frontend/src/shared/components/Header.tsx`

**Checkpoint**: At this point, User Story 1 (Global Navigation) should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Understand Platform Value via Landing Page Content (Priority: P2)

**Goal**: As a prospective donor, I want to read about the platform's features, AI capabilities, and see testimonials from other donors.

**Independent Test**: Can be fully tested by verifying the structural rendering of the Hero, Features, and Testimonials sections on different viewport sizes.

### Implementation for User Story 2

- [X] T011 [P] [US2] Implement `<HeroSection />` component in `src/frontend/src/modules/landing-page/components/HeroSection.tsx` (using Flexbox/Grid, NO absolute positioning)
- [X] T012 [P] [US2] Implement `<FeaturesSection />` component in `src/frontend/src/modules/landing-page/components/FeaturesSection.tsx` (using Grid for the 3-column layout)
- [X] T013 [P] [US2] Implement `<TestimonialSection />` component in `src/frontend/src/modules/landing-page/components/TestimonialSection.tsx` (using flex-row/col based on breakpoints)
- [X] T014 [P] [US2] Implement `<CTASection />` component in `src/frontend/src/modules/landing-page/components/CTASection.tsx`
- [X] T015 [US2] Assemble all section components sequentially into `src/frontend/src/modules/landing-page/LandingPage.tsx`
- [X] T016 [US2] Verify and manually strip any leftover absolute positioning (`top-[...]`, `left-[...]`) inherited from the Figma export across all new components.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. The page should look fully styled and responsive.

---

## Phase 5: User Story 3 - Localization and Accessibility (Priority: P2)

**Goal**: As a Vietnamese speaker, I want to view the landing page content in Vietnamese.

**Independent Test**: Can be tested independently by toggling the language selector and verifying all text strings translate correctly without a page refresh.

### Implementation for User Story 3

- [X] T017 [P] [US3] Create Vietnamese and English translation files with the required text strings in `src/frontend/src/i18n/vi.json` and `src/frontend/src/i18n/en.json`
- [X] T018 [US3] Wire up the language toggle button to the `useTranslation` hook in `src/frontend/src/shared/components/Header.tsx`
- [X] T019 [US3] Replace all hardcoded strings with i18n keys across all components in `src/frontend/src/modules/landing-page/components/` (Hero, Features, Testimonial, CTA)

**Checkpoint**: All user stories should now be independently functional. The page is now fully bilingual.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T020 [P] Clean up any unused CSS classes or redundant files from the monolithic `src/StakeholderDocuments/code.txt` reference.
- [X] T021 Run quickstart.md validation steps (responsiveness, navigation links, localization) locally.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates into the Layout provided by US1, but the section components can be built independently.
- **User Story 3 (P3)**: Depends heavily on US1 and US2 components existing to apply localization keys to them.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003).
- Once Foundational phase completes, US1 components (Header, Footer) can be built in parallel.
- All section components for US2 (T011, T012, T013, T014) can be built completely in parallel by different team members before being assembled in T015.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (Header/Footer navigation works)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Full Page Layout)
4. Add User Story 3 → Test independently → Deploy/Demo (Bilingual)
5. Each story adds value without breaking previous stories
