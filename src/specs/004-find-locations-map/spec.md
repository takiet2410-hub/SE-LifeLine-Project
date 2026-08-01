# Feature Specification: Find Locations Map

**Feature Branch**: `[not-set]`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "/speckit-specify Build the "Find Locations" interactive map page for the LifeLine blood donation platform. Please analyze the provided reference code for `FindDonationLocations` and the UI design image "Find Donation Locations_3.jpg", along with the location data from "campaign.json". Generate a complete specification document (`spec.md`) for this feature that aligns with our project constraints: a responsive React (Vite) SPA using Tailwind CSS, with strict TypeScript typing. CRITICAL DEVIATIONS FROM PROTOTYPE: Unlike the provided Figma design and monolithic code, this page will NOT include the right-side search panel, center type filters, or the static list of hospital cards. The entire page content (below the global navigation) must be dedicated purely to a full-width/full-height interactive map using GoongAPI."

## Summary

The "Find Locations" page provides a purely visual, interactive map-based interface to help potential donors find fixed blood donation points and the LifeLine Headquarters in Ho Chi Minh City. Powered by GoongAPI, this full-width and full-height map page intentionally removes all search panels, center type filters, and static list views found in previous prototypes to focus entirely on spatial discovery. The map statically plots seven specific locations, providing basic tooltip information (name and address) upon interaction.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore Donation Locations on Map (Priority: P1)

As a potential donor, I want to view a full-screen interactive map so that I can easily see where blood donation centers are located across Ho Chi Minh City.

**Why this priority**: Visualizing locations is the core purpose of the page, allowing users to intuitively grasp proximity without relying on text lists.

**Independent Test**: Can be fully tested by loading the page and verifying the GoongAPI map renders at full width/height below the navigation bar without any side panels or search overlays.

**Acceptance Scenarios**:

1. **Given** I navigate to the "Find Locations" page, **When** the page loads, **Then** I see a full-width and full-height interactive map taking up the entire screen below the header.
2. **Given** the map is rendered, **When** I inspect the UI, **Then** there are no search panels, center type filters, or static hospital list cards visible.
3. **Given** the interactive map, **When** I click and drag or use the scroll wheel, **Then** I can pan and zoom across the map smoothly.

---

### User Story 2 - Identify Specific Donation Centers and HQ (Priority: P1)

As a potential donor, I want to see clearly marked pins on the map for all active donation centers and the LifeLine HQ so that I can find the exact locations.

**Why this priority**: Users need specific location coordinates plotted correctly to know exactly where to go.

**Independent Test**: Can be fully tested by verifying that exactly 7 distinct markers are plotted at the specified coordinates.

**Acceptance Scenarios**:

1. **Given** the map has loaded, **When** I look at the map, **Then** I see exactly 6 markers representing the donation centers and 1 distinct marker representing the LifeLine HQ.
2. **Given** the map has loaded, **When** I view the LifeLine HQ marker, **Then** it has a distinct visual appearance (e.g., color or icon) compared to the standard donation center markers.

---

### User Story 3 - View Location Details (Priority: P2)

As a potential donor, I want to click on a map marker so that I can see the name and address of that specific donation center or HQ.

**Why this priority**: While knowing the location visually is helpful, users need the actual name and address to navigate using their own devices or for their reference.

**Independent Test**: Can be fully tested by clicking each of the 7 markers and verifying a tooltip or popup appears with the correct name and address.

**Acceptance Scenarios**:

1. **Given** I am viewing the interactive map, **When** I click on a donation center marker, **Then** a tooltip or popup appears displaying the center's name and address.
2. **Given** I have a tooltip open, **When** I click elsewhere on the map, **Then** the tooltip closes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a full-width and full-height interactive map using GoongAPI below the global navigation bar.
- **FR-002**: The system MUST NOT render any right-side search panels, center type filters, or static lists of hospital cards on the map page.
- **FR-003**: The system MUST statically plot exactly 7 markers on the map using the following coordinates:
  - Trung Tâm Hiến Máu Nhân Đạo Tp.HCM (106.6544639, 10.7769653)
  - Bệnh viện Truyền máu Huyết học (106.665875, 10.7565468)
  - Điểm hiến máu 466 Nguyễn Thị Minh Khai (106.688564, 10.7727914)
  - Điểm hiến máu 24 Nguyễn Thị Diệu (106.6882594, 10.7754837)
  - Bệnh viện Ung Bướu TP. HCM (106.7739255, 10.8448994)
  - AEON MALL BÌNH TÂN (106.6117959, 10.7427835)
  - LifeLine Headquarters: Đại học Khoa Học Tự Nhiên, 227 Nguyễn Văn Cừ (106.682472, 10.762861)
- **FR-004**: The system MUST use a distinct visual marker (different color or icon) for the LifeLine Headquarters compared to the other 6 donation centers.
- **FR-005**: The system MUST display a tooltip or popup containing the location's name and address when a user clicks on any of the 7 markers.
- **FR-006**: The system MUST allow users to pan and zoom the map.

### Key Entities

- **LocationMarker**: Represents a plotted point on the map.
  - Attributes: `id`, `name`, `address`, `longitude`, `latitude`, `type` (e.g., 'HQ' or 'DonationCenter').

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the page area below the header is utilized by the map interface.
- **SC-002**: Exactly 7 specific locations are successfully plotted on the map upon initial load.
- **SC-003**: Tooltips for all 7 locations display the correct name and address when interacted with.
- **SC-004**: The map component loads and is interactive (pannable/zoomable) on mobile, tablet, and desktop devices without breaking the layout.

## Edge Cases

- **Missing/Invalid GoongAPI Key**: What happens if the GoongAPI key is missing, expired, or invalid? The system should display a graceful fallback UI or error message instead of a blank screen or crashing the app.
- **Network Failures**: How does the map behave on slow networks or if the GoongAPI servers are unreachable? The page should show a loading skeleton or a retry prompt.
- **Marker Overlap**: How are markers handled at low zoom levels (zoomed out) when they might overlap? Users must still be able to distinguish and click individual markers without UI glitches.

## Assumptions

- **GoongAPI Integration**: It is assumed that the project already has a valid GoongAPI key or one will be provisioned in the environment variables.
- **Map Center & Zoom**: The map will default to centering on Ho Chi Minh City with an appropriate zoom level to encapsulate all 7 markers on initial load.
