# Feature Specification: How It Works Page

**Feature Branch**: `003-how-it-works-page`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "Build the public-facing "How It Works" page for the LifeLine blood donation platform. Please analyze the provided monolithic reference code in "code(2).txt" and the UI design image "How It Works - LifeLine (Updated Nav)_3.jpg"[cite: 7]. Generate a complete specification document (`spec.md`) for this feature that aligns with our project constraints..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand the Donation Journey (Priority: P1)

As a potential donor, I want to see the step-by-step process of blood donation so that I know exactly what to expect from registration to recovery.

**Why this priority**: Educating the donor on the process is the primary purpose of the "How It Works" page and reduces anxiety or confusion.

**Independent Test**: Can be fully tested by verifying that the "Your Journey to Saving Lives" section accurately renders the 4 sequential steps (Registration, Donation, Recovery, Track Impact) in a responsive layout without overlapping or clipping text.

**Acceptance Scenarios**:

1. **Given** the user navigates to the "How It Works" page, **When** they scroll to the journey section, **Then** they see 4 distinct step cards in the correct sequential order.
2. **Given** the user views the page on a mobile device, **When** they look at the journey section, **Then** the step cards stack vertically or adapt fluidly to prevent horizontal scrolling.

---

### User Story 2 - Check Donation Eligibility (Priority: P2)

As a potential donor, I want to check the basic eligibility criteria so that I can determine if I am qualified to donate blood before signing up.

**Why this priority**: Prevents ineligible users from proceeding to registration, saving time for both the user and the platform.

**Independent Test**: Can be fully tested by verifying the "Are You Eligible to Donate?" section renders the 4 criteria cards (Age, Weight, Health Status, Interval).

**Acceptance Scenarios**:

1. **Given** the user is on the "How It Works" page, **When** they view the eligibility section, **Then** they see 4 cards detailing requirements for Age, Weight, Health Status, and Donation Interval.
2. **Given** the user switches the language to Vietnamese, **When** they view the eligibility cards, **Then** the text translates correctly and the layout does not break despite potentially longer Vietnamese strings.

---

### User Story 3 - Proceed to Registration (Call-to-Action) (Priority: P3)

As a convinced potential donor, I want a clear call-to-action to sign up so that I can immediately start my donation journey.

**Why this priority**: The ultimate goal of the page is conversion (getting the user to register).

**Independent Test**: Can be fully tested by clicking the "Sign Up Now" button in the "Ready to become a hero?" section and verifying navigation to the registration page.

**Acceptance Scenarios**:

1. **Given** the user reaches the bottom of the "How It Works" page, **When** they click the "Sign Up Now" button, **Then** they are redirected to the `/register` route.

---

### Edge Cases

- **Missing Icons**: What happens if the SVG icons for the step/eligibility cards fail to load or are missing? The UI should have a fallback standard icon or gracefully handle the absence without breaking the card layout.
- **Broken Navigation**: What happens if the "Sign Up Now" button points to an invalid route? The link must strictly map to the valid `/register` route.
- **Translation Overflow**: How does the system handle Vietnamese translation strings that are significantly longer than English placeholders? The layout must use flexible heights and flexbox wrapping to prevent text from overflowing or overlapping card boundaries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST dynamically render the structural sections ("Your Journey", "Eligibility", "Call-to-Action") using React components.
- **FR-002**: System MUST highlight the "How It Works" link in the global navigation header as the active route with a bottom border when the user is on the `/how-it-works` path.
- **FR-003**: System MUST support i18next localization, fully translating all mixed language content (e.g., "Khám phá quy trình hiến máu...") into complete English (`en`) and Vietnamese (`vi`) namespaces.
- **FR-004**: System MUST display 4 sequential step cards (Registration, Donation, Recovery, Track Impact) with respective icons and descriptions.
- **FR-005**: System MUST display 4 eligibility cards (Age, Weight, Health Status, Interval) with respective icons and criteria.

### Non-Functional Requirements

- **NFR-001**: The UI MUST ensure fluid responsiveness across mobile, tablet, and desktop viewports using Tailwind CSS grid/flexbox utilities.
- **NFR-002**: The codebase MUST NOT contain any hardcoded absolute positioning classes (e.g., `absolute left-[560px] top-[294px]`) generated by design tools like Figma. All layouts must be relative/flow-based.
- **NFR-003**: The implementation MUST use strict TypeScript typing (`strict: true`) for all component props and state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Figma-generated absolute positioning classes are removed and replaced with standard Tailwind responsive flow classes.
- **SC-002**: The page passes visual regression testing on standard mobile (375px), tablet (768px), and desktop (1024px+) breakpoints without horizontal scrolling or text clipping.
- **SC-003**: Language toggling between English and Vietnamese updates 100% of the textual content on the page without breaking layout constraints.

## Assumptions

- Standard standard SVG icons are available or can be easily extracted from the provided design references.
- The global `<Header />` and `<Footer />` components already exist and can be wrapped around the new page content.
- The `i18next` framework is already initialized and functional in the project architecture.
