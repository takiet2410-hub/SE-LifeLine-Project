# Phase 0: Research & Technical Decisions

## 1. Map Rendering Engine

**Decision**: Use `Leaflet` integrated with `@maplibre/maplibre-gl-leaflet` for GoongAPI tile rendering.
**Rationale**: This strictly aligns with the existing implementation pattern in `src/frontend/src/modules/booking-location/pages/InteractiveMapPage.tsx`. Reusing this pattern ensures consistency across the application, avoids pulling in duplicate mapping libraries (like `react-map-gl`), and seamlessly handles Goong's Mapbox GL JS-compatible style JSON.
**Alternatives considered**: `react-map-gl` or `@goongmaps/goong-map-react`. Rejected because it would introduce a new dependency and deviate from the established project pattern.

## 2. Component Placement

**Decision**: Create `FindLocationsPage.tsx` and `PublicDonationMap.tsx` inside the `landing-page` module.
**Rationale**: The user requirements specify that this is a public-facing page dedicated solely to visualizing the map, without the complex scheduling/booking features found in the `booking-location` module. Grouping this under `landing-page` correctly isolates public marketing/informational views from authenticated workflows, adhering to the architecture constitution.
**Alternatives considered**: Modifying the existing `InteractiveMapPage.tsx` with conditional props (e.g. `isPublic={true}`). Rejected because it would bloat the existing complex component and mix unrelated UI concerns, violating the single responsibility principle.

## 3. Data Management

**Decision**: Hardcode the 7 specific locations directly as a strongly typed `const` array (`MapMarker[]`).
**Rationale**: The specification explicitly mandates exactly 7 static locations (1 HQ, 6 Centers). There is no requirement for dynamic fetching or a backend API connection for this page. 
**Alternatives considered**: Fetching from `/api/campaigns`. Rejected because the prompt instructs static plotting of these exact locations extracted from campaign data, and adding an API fetch introduces unnecessary loading states and complexity for a static visual page.
