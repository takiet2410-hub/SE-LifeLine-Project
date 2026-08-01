# Implementation Tasks: Health Tips Page

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Define `TipCardProps` and `FAQItemProps` interfaces in `src/modules/content-news/types/healthTips.types.ts`
- [X] T002 Create static data arrays `HEALTH_TIPS_DATA` and `FAQ_DATA` with `i18next` translation keys in `src/modules/content-news/data/healthTipsData.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**🚨 CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Ensure `i18next` is properly configured and translation JSON files (en/vi) are ready to accept new keys for the `content-news` namespace.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Health Tips Resources (Priority: P1) 🏆 MVP

**Goal**: Users should be able to view the highlighted featured article, browse the categorized tip cards, and expand/collapse the FAQ accordion items.

**Independent Test**: Navigate to the route `/health-tips` and visually confirm all static content renders correctly without the search bar, layout scales across breakpoints, and the FAQ toggles.

### Implementation for User Story 1

- [X] T004 [P] [US1] Create atomic `<FeaturedArticle />` component in `src/modules/content-news/components/health-tips/FeaturedArticle.tsx`
- [X] T005 [P] [US1] Create atomic `<TipCard />` component using Tailwind flex layout in `src/modules/content-news/components/health-tips/TipCard.tsx`
- [X] T006 [P] [US1] Create atomic `<FAQItem />` component with `isExpanded` local state in `src/modules/content-news/components/health-tips/FAQItem.tsx`
- [X] T007 [US1] Implement `<TipCategoryGrid />` layout component mapping `HEALTH_TIPS_DATA` using Tailwind Grid in `src/modules/content-news/components/health-tips/TipCategoryGrid.tsx`
- [X] T008 [US1] Implement `<FAQAccordion />` layout component mapping `FAQ_DATA` using Flexbox in `src/modules/content-news/components/health-tips/FAQAccordion.tsx`
- [X] T009 [US1] Assemble `<HealthTipsPage />` combining all components and removing absolute positioning in `src/modules/content-news/pages/HealthTipsPage.tsx`
- [X] T010 [US1] Register route for `HealthTipsPage` in the application routing (e.g. `src/frontend/src/App.tsx`).

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T011 [P] Populate actual translation strings into the local Vietnamese and English `i18next` JSON dictionaries (e.g., replacing "MEDICAL GUIDANCE" with translated equivalents).
- [X] T012 Run quickstart.md validation scenarios to verify responsiveness and i18next switching.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.

### Within Each User Story

- Atomic components (`<TipCard />`, `<FAQItem />`, `<FeaturedArticle />`) can be implemented in parallel.
- Container components (`<TipCategoryGrid />`, `<FAQAccordion />`) depend on their respective atomic components.
- Page assembly (`<HealthTipsPage />`) depends on all containers.

### Parallel Opportunities

- T004, T005, and T006 can all be executed in parallel by different developers.

---

## Parallel Example: User Story 1

```bash
# Launch atomic component creation in parallel:
Task: "Create atomic <FeaturedArticle /> component..."
Task: "Create atomic <TipCard /> component..."
Task: "Create atomic <FAQItem /> component..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup data and types.
2. Complete Phase 2: Confirm i18next readiness.
3. Complete Phase 3: Implement atomic components, assemble the page, and register the route.
4. **STOP and VALIDATE**: Test User Story 1 independently via browser at `/health-tips`.
5. Run Polish tasks to finalize translations.

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Ensure all absolute positioning is removed as per the spec.
