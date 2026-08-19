---
description: "Task list for Find Locations Map feature"
---

# Tasks: Find Locations Map

**Input**: Design documents from `/specs/004-find-locations-map/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No explicit tests were requested; validation is covered by `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend: `src/frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Ensure environment variable `VITE_GOONG_API_KEY` is documented in `src/frontend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Define `MapMarker` and `Coordinates` interfaces in `src/frontend/src/types/map.types.ts`
- [x] T003 [P] Export static array of 7 map locations in `src/frontend/src/modules/landing-page/components/find-locations/mapData.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Explore Donation Locations on Map (Priority: P1) 🎯 MVP

**Goal**: Full-screen interactive map without legacy panels.

**Independent Test**: Load page and verify GoongAPI map renders at full width/height without search/list overlays.

### Implementation for User Story 1

- [x] T004 [US1] Create full-screen `FindLocationsPage` layout in `src/frontend/src/modules/landing-page/pages/FindLocationsPage.tsx`
- [x] T005 [US1] Create `PublicDonationMap` shell using Leaflet and `@maplibre/maplibre-gl-leaflet` in `src/frontend/src/modules/landing-page/components/find-locations/PublicDonationMap.tsx`
- [x] T006 [US1] Add routing for `/find-locations` pointing to `FindLocationsPage` in `src/frontend/src/App.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional with an empty pannable/zoomable map.

---

## Phase 4: User Story 2 - Identify Specific Donation Centers and HQ (Priority: P1)

**Goal**: Plot exactly 7 static locations on the map with a distinct visual marker for LifeLine HQ.

**Independent Test**: Visually verify 6 standard markers and 1 distinct HQ marker are placed correctly in HCMC.

### Implementation for User Story 2

- [x] T007 [US2] Import static locations and render standard Leaflet markers in `src/frontend/src/modules/landing-page/components/find-locations/PublicDonationMap.tsx`
- [x] T008 [US2] Apply distinct visual styling (e.g., custom icon/color) specifically for the HQ marker in `src/frontend/src/modules/landing-page/components/find-locations/PublicDonationMap.tsx`

**Checkpoint**: Map correctly plots all coordinates with the HQ standing out.

---

## Phase 5: User Story 3 - View Location Details (Priority: P2)

**Goal**: Display location name and address when clicking a marker.

**Independent Test**: Click each marker to verify a popup opens with the correct text, and clicking elsewhere closes it.

### Implementation for User Story 3

- [x] T009 [US3] Bind Leaflet popups to all markers to display name and address in `src/frontend/src/modules/landing-page/components/find-locations/PublicDonationMap.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 Validate the implementation against all scenarios in `specs/004-find-locations-map/quickstart.md`
- [x] T011 Verify graceful fallback or error handling if `VITE_GOONG_API_KEY` is missing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed sequentially (US1 → US2 → US3) since US2 and US3 modify the same file (`PublicDonationMap.tsx`) created in US1.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- T002 and T003 can be executed in parallel during the Foundational phase.
- Further parallelization is limited as `PublicDonationMap.tsx` is iteratively enhanced across the User Stories.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: Verify the empty interactive map loads full-screen.

### Incremental Delivery

1. Complete Setup + Foundational.
2. Add US1 → Validate empty map.
3. Add US2 → Validate 7 markers.
4. Add US3 → Validate interactive popups.

## Notes

- Verify that no right-side panels or search components are accidentally brought over from `InteractiveMapPage.tsx`.
