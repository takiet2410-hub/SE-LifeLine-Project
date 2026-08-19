---
description: "Task list for About Us Page implementation"
---

# Tasks: About Us Page

**Input**: Design documents from `specs/002-about-us-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create component directories `src/frontend/src/modules/landing-page/components/about/` and `src/frontend/src/types/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Define `ImpactStatProps` and `CoreValueProps` interfaces in `src/frontend/src/types/about.ts`
- [X] T003 Update i18n JSON files `src/frontend/src/i18n/locales/en/landing.json` and `src/frontend/src/i18n/locales/vi/landing.json` with About Us keys
- [X] T004 [P] Extract and create `IconDonors.tsx` and `IconHospital.tsx` in `src/frontend/src/shared/components/Icons/`
- [X] T005 [P] Extract and create `IconReliability.tsx`, `IconHumanCentered.tsx`, and `IconInnovation.tsx` in `src/frontend/src/shared/components/Icons/`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Viewing Platform Mission and Impact (Priority: P1) 🎯 MVP

**Goal**: Display the mission statement and the real-time impact statistics cards using Tailwind Flexbox/Grid instead of absolute positioning.

**Independent Test**: Load the `/about` route and verify the presence of the mission statement and the three key metric cards (50,000+ Active Donors, 120+ Partner Hospitals, 150,000+ Lives Impacted) with responsive layout.

### Implementation for User Story 1

- [X] T006 [P] [US1] Create `<MissionSection />` component in `src/frontend/src/modules/landing-page/components/about/MissionSection.tsx`
- [X] T007 [P] [US1] Create reusable `<StatCard />` component in `src/frontend/src/modules/landing-page/components/about/StatCard.tsx`
- [X] T008 [US1] Create `<ImpactStats />` component in `src/frontend/src/modules/landing-page/components/about/ImpactStats.tsx` utilizing `StatCard`
- [X] T009 [US1] Integrate `MissionSection` and `ImpactStats` into `src/frontend/src/modules/landing-page/pages/AboutUsPage.tsx` using flexbox/grid layout

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 3 - Engaging with the Call-to-Action (Priority: P1)

**Goal**: Implement clear Call-to-Action (CTA) buttons at the bottom of the page to funnel users into the registration flow.

**Independent Test**: Click the "Sign Up Now" button in the CTA section and verify the router pushes the user to the `/register` route.

### Implementation for User Story 3

- [X] T010 [P] [US3] Create `<CallToAction />` component in `src/frontend/src/modules/landing-page/components/CallToAction.tsx`
- [X] T011 [US3] Integrate `<CallToAction />` into `src/frontend/src/modules/landing-page/pages/AboutUsPage.tsx`

**Checkpoint**: At this point, User Stories 1 AND 3 should both work independently

---

## Phase 5: User Story 2 - Discovering the Story and Core Values (Priority: P2)

**Goal**: Present the platform's origin story and its three core values using a responsive grid layout.

**Independent Test**: Scroll down the `/about` page and ensure the "Our Story" text and the three Core Values cards are displayed without overlapping text on mobile or desktop.

### Implementation for User Story 2

- [X] T012 [P] [US2] Create `<OurStory />` component in `src/frontend/src/modules/landing-page/components/about/OurStory.tsx`
- [X] T013 [P] [US2] Create reusable `<ValueCard />` component in `src/frontend/src/modules/landing-page/components/about/ValueCard.tsx`
- [X] T014 [US2] Create `<CoreValues />` component in `src/frontend/src/modules/landing-page/components/about/CoreValues.tsx` utilizing `ValueCard`
- [X] T015 [US2] Integrate `OurStory` and `CoreValues` into `src/frontend/src/modules/landing-page/pages/AboutUsPage.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T016 Verify "About Us" link highlight logic inside `src/frontend/src/shared/components/Header.tsx` based on route location
- [X] T017 Run visual responsive checks to ensure 100% of monolithic absolute positioning has been removed
- [X] T018 Run `quickstart.md` validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 3 (P1) should be executed first.
  - User Story 2 (P2) can follow.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- Foundation: SVG Icon extractions (T004, T005) can run concurrently with TS Definitions (T002) and JSON localization (T003).
- Within Stories: Reusable card components (T007, T013) can be built in parallel with section wrappers (T006, T012).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2: Setup & Foundational
2. Complete Phase 3: User Story 1 (Mission and Stats)
3. **STOP and VALIDATE**: Test `/about` route for Mission and Stats rendering.

### Incremental Delivery

1. Add User Story 3 (CTA section) → Validate routing interaction.
2. Add User Story 2 (Story & Core Values) → Validate grid layouts across viewports.
3. Final Polish → Verify Header highlights and language toggle behavior.
