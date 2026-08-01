---
description: "Task list for How It Works Page implementation"
---

# Tasks: How It Works Page

**Input**: Design documents from `specs/003-how-it-works-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the feature

- [X] T001 Initialize TS interfaces `JourneyStepProps`, `EligibilityCriterionProps` in `src/frontend/src/types/how-it-works.ts`
- [X] T002 [P] Configure i18n JSON structure for `howItWorks` namespace in `src/frontend/src/i18n/locales/en/landing.json`
- [X] T003 [P] Configure i18n JSON structure for `howItWorks` namespace in `src/frontend/src/i18n/locales/vi/landing.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T004 [P] Extract SVGs into Icon components (Registration, Donation, Recovery, Track) in `src/frontend/src/shared/components/Icons/`
- [X] T005 [P] Extract SVGs into Icon components (Age, Weight, Health, Interval) in `src/frontend/src/shared/components/Icons/`

**Checkpoint**: Foundation ready - SVG Icons and types are available for atomic components.

---

## Phase 3: User Story 1 - Understand the Donation Journey (Priority: P1) 🎯 MVP

**Goal**: Show the step-by-step process of blood donation (Registration, Donation, Recovery, Track Impact).

**Independent Test**: Can be fully tested by verifying that the "Your Journey to Saving Lives" section accurately renders the 4 sequential steps in a responsive layout.

### Implementation for User Story 1

- [X] T006 [P] [US1] Build `<StepCard />` atomic component in `src/frontend/src/modules/landing-page/components/how-it-works/StepCard.tsx`
- [X] T007 [US1] Build `<JourneySteps />` page-level section in `src/frontend/src/modules/landing-page/components/how-it-works/JourneySteps.tsx`
- [X] T008 [US1] Create `<HowItWorksPage />` page layout and include `<JourneySteps />` in `src/frontend/src/modules/landing-page/pages/HowItWorksPage.tsx`
- [X] T009 [US1] Register the route `/how-it-works` in routing configuration (e.g., `src/frontend/src/App.tsx` or module router).

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Check Donation Eligibility (Priority: P2)

**Goal**: Display basic eligibility criteria cards (Age, Weight, Health Status, Interval).

**Independent Test**: Can be fully tested by verifying the "Are You Eligible to Donate?" section renders the 4 criteria cards properly.

### Implementation for User Story 2

- [X] T010 [P] [US2] Build `<EligibilityCard />` atomic component in `src/frontend/src/modules/landing-page/components/how-it-works/EligibilityCard.tsx`
- [X] T011 [US2] Build `<EligibilitySection />` page-level section in `src/frontend/src/modules/landing-page/components/how-it-works/EligibilitySection.tsx`
- [X] T012 [US2] Integrate `<EligibilitySection />` into `src/frontend/src/modules/landing-page/pages/HowItWorksPage.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Proceed to Registration (Call-to-Action) (Priority: P3)

**Goal**: Provide a clear call-to-action to sign up at the bottom of the page.

**Independent Test**: Can be fully tested by clicking the "Sign Up Now" button and verifying navigation to the `/register` route.

### Implementation for User Story 3

- [X] T013 [P] [US3] Reuse or create `<CallToAction />` component and add it to `src/frontend/src/modules/landing-page/pages/HowItWorksPage.tsx`
- [X] T014 [US3] Verify "Sign Up Now" button in `<CallToAction />` correctly routes to `/register`.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T015 [P] Verify removal of all hardcoded Figma absolute positioning classes across newly created components.
- [X] T016 [P] Verify Header component highlights "How It Works" with a bottom border when on `/how-it-works`.
- [X] T017 [P] Test mobile/tablet responsive layout (Tailwind Grid/Flexbox wrapping) across all sections.
- [X] T018 Test i18next EN/VI language toggling against long Vietnamese string variations.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can proceed sequentially (P1 → P2 → P3).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2).
- **User Story 2 (P2)**: Can start after Foundational (Phase 2).
- **User Story 3 (P3)**: Can start after Foundational (Phase 2).

### Parallel Opportunities

- T002 and T003 can be done in parallel.
- T004 and T005 can be done in parallel by splitting SVG asset extraction tasks.
- T006, T010, and T013 can be started in parallel once Phase 2 is finished, as they are atomic components for different sections.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Types and Translations).
2. Complete Phase 2: Foundational (SVG Icons).
3. Complete Phase 3: User Story 1 (Journey Steps).
4. **STOP and VALIDATE**: Test User Story 1 independently in browser at `/how-it-works`.

### Incremental Delivery

1. Complete Setup + Foundational.
2. Add User Story 1 → Test independently.
3. Add User Story 2 → Test independently.
4. Add User Story 3 → Test independently.
5. Run Final Polish steps (Phase 6) to ensure strict adherence to UI constraints (NFR-U-01, NFR-U-02).
