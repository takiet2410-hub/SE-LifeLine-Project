# Feature Specification: About Us Page

**Feature Branch**: `[002-about-us-page]`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "Build the public-facing 'About Us' page for the LifeLine blood donation platform..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Viewing Platform Mission and Impact (Priority: P1)

As a potential donor or partner visiting the platform, I want to see the platform's mission ("Every Drop Counts") and real-time impact statistics (Active Donors, Partner Hospitals, Lives Impacted) so that I understand the value and scale of LifeLine's work.

**Why this priority**: Establishing trust and demonstrating impact are critical for converting visitors into registered donors.

**Independent Test**: Can be fully tested by loading the `/about` route and verifying the presence of the mission statement and the three key metric cards (50,000+ Active Donors, 120+ Partner Hospitals, 150,000+ Lives Impacted).

**Acceptance Scenarios**:

1. **Given** the user navigates to `/about`, **When** the page loads, **Then** the "Our Mission" section must be visible with the text "Every Drop Counts".
2. **Given** the user is viewing the impact section, **When** they look at the statistics, **Then** exactly three metrics (50,000+, 120+, 150,000+) must be rendered responsively.
3. **Given** the global navigation header is rendered, **When** the user is on the `/about` route, **Then** the "About Us" link must be highlighted as the active route with a bottom border (e.g., `border-b-2 border-[#93000B]`).

---

### User Story 2 - Discovering the Story and Core Values (Priority: P2)

As a visitor, I want to read the platform's origin story and its core values (Reliability, Human-Centered, Innovation) so that I feel aligned with the organization's culture and goals.

**Why this priority**: Fosters an emotional connection with the user, encouraging long-term retention and advocacy.

**Independent Test**: Can be fully tested by scrolling down the `/about` page and ensuring the "Our Story" text and the three Core Values cards are displayed and laid out correctly across different screen sizes.

**Acceptance Scenarios**:

1. **Given** the user scrolls to the "Our Story" section, **When** it renders, **Then** the foundational history from 2024 must be readable alongside its accompanying image.
2. **Given** the user scrolls to the "Our Core Values" section, **When** it renders, **Then** exactly three value cards (Reliability, Human-Centered, Innovation) must be displayed in a responsive grid/flex layout.

---

### User Story 3 - Engaging with the Call-to-Action (Priority: P1)

As an inspired visitor who just read about the platform's impact, I want clear Call-to-Action (CTA) buttons so that I can easily sign up or join the network.

**Why this priority**: This is the primary conversion funnel for the page.

**Independent Test**: Can be fully tested by clicking the "Join Our Network" or "Sign Up Now" buttons and verifying the router pushes the user to the registration flow.

**Acceptance Scenarios**:

1. **Given** the user is on the About Us page, **When** they click "Join Our Network" in the Mission section, **Then** they must be navigated to the `/register` route.
2. **Given** the user is in the bottom CTA section ("Ready to save a life?"), **When** they click "Sign Up Now", **Then** they must be navigated to the `/register` route.

## Edge Cases

- What happens when image assets (like the mission background image or the story image) fail to load? (Must implement visual fallbacks, e.g., a colored placeholder block with an icon or alt text).
- How does the system handle extremely long translation strings (e.g., in Vietnamese) within the Core Values cards? (Cards must use flexbox to stretch vertically and wrap text properly without overflowing or breaking the layout).
- How does the system handle broken navigation paths if the user clicks a CTA while the `/register` route is misconfigured? (Should safely fallback or show a toast error without crashing the app).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render the About Us page at the `/about` route using the existing global Layout wrapper (Header/Footer).
- **FR-002**: The global Header MUST dynamically highlight the "About Us" link with a bottom border when the current route matches `/about`.
- **FR-003**: The system MUST dynamically render the structural sections (Mission, Difference We Make, Story, Core Values, CTA) sequentially.
- **FR-004**: The system MUST integrate `i18next` for all textual content, providing translation keys for both English and Vietnamese localization.
- **FR-005**: CTA buttons ("Join Our Network", "Sign Up Now") MUST trigger client-side navigation to the `/register` route via React Router.

### Non-functional Requirements

- **NFR-001**: The layout MUST use Tailwind CSS flexbox and grid utilities to ensure fluid responsiveness across mobile, tablet, and desktop viewports.
- **NFR-002**: The codebase MUST explicitly REMOVE all hardcoded absolute positioning (e.g., `absolute left-0 top-[604px]`, `absolute left-[179px] top-[33px]`) inherited from the Figma monolithic code.
- **NFR-003**: The UI MUST be cross-browser compatible (Chrome, Edge, Firefox, Safari).
- **NFR-004**: The code MUST be strictly typed using TypeScript (`strict: true`).

### Key Entities

- **Translation Payload**: JSON objects in `en.json` and `vi.json` mapping UI keys (e.g., `about.mission.title`) to localized strings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the absolutely positioned utility classes from the monolithic Figma export are removed and replaced with standard document flow utilities (Flexbox/Grid).
- **SC-002**: The page passes visual regression testing (no horizontal scrolling or text overlap) on mobile (375px), tablet (768px), and desktop (1280px) breakpoints.
- **SC-003**: All text on the page can be toggled between English and Vietnamese without layout breaks.

## Assumptions

- Standard routing (`react-router-dom`) and `i18next` are already installed and configured in the project.
- Missing images will use standard CSS fallbacks (`bg-gray-200`) until final assets are provided.
- The `Icon` components (or SVGs) required for the Core Values and Impact sections can be placed inline or extracted to `shared/components/Icons/`.
