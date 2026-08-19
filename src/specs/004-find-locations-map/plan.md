# Implementation Plan: Find Locations Map

**Branch**: `[not-set]` | **Date**: 2026-08-01 | **Spec**: [specs/004-find-locations-map/spec.md](specs/004-find-locations-map/spec.md)

**Input**: Feature specification from `/specs/004-find-locations-map/spec.md`

## Summary

The "Find Locations" page is a purely visual, interactive map-based interface using GoongAPI, providing a full-width/full-height view to help potential donors find fixed blood donation points and the LifeLine Headquarters in HCMC. It statically plots 7 defined locations and intentionally excludes all search panels and list views.

## Technical Context

**Language/Version**: TypeScript 5+ (Strict Mode enabled)

**Primary Dependencies**: React (Vite), Tailwind CSS, Leaflet, `@maplibre/maplibre-gl-leaflet`, GoongAPI (MapTiles)

**Storage**: None (Static Data Array in code)

**Testing**: React Testing Library / Jest (as per project conventions)

**Target Platform**: Web browsers (Mobile, Tablet, Desktop)

**Project Type**: React Single Page Application (SPA) - Frontend

**Performance Goals**: Instant page load; smooth panning/zooming on the map component.

**Constraints**: Adherence to Vite/React strict mode constraints. Must reuse existing GoongAPI initialization patterns (Leaflet + MapLibre integration) for consistency. No dynamic API calls for location markers.

**Scale/Scope**: 1 full-screen UI component, 7 static locations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture & Module Boundaries**: Passes. Component will live in `src/frontend/src/modules/landing-page/pages/` or an appropriate public routing module, separated from the booking logic.
- **Security & Compliance**: Passes. No user data handled. Uses environment variable for Goong API key.
- **Code Quality**: Passes. Will use strict TypeScript interfaces for `MapMarker`.
- **UI/UX**: Passes. Completely removes deprecated Figma components (search panels) per the specification. Responsive design enforced via Tailwind CSS.

## Project Structure

### Documentation (this feature)

```text
specs/004-find-locations-map/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (Empty, no API contracts)
```

### Source Code (repository root)

```text
src/frontend/src/
├── modules/
│   └── landing-page/
│       ├── pages/
│       │   └── FindLocationsPage.tsx
│       └── components/
│           └── find-locations/
│               └── PublicDonationMap.tsx
```

**Structure Decision**: The component will be scaffolded within the `landing-page` module since this is a public-facing page, accessible from the global navigation. 

## Implementation Sequence

1. **Phase 1: Interfaces & Static Data**
   - Define TypeScript interfaces `MapMarker` and `Coordinates`.
   - Set up the static data array containing the exact coordinates from the spec (1 HQ + 6 donation centers).

2. **Phase 2: Layout Scaffolding**
   - Scaffold `FindLocationsPage` using a full-screen layout (`h-[calc(100vh-64px)]` or similar to offset the global navbar) using Tailwind CSS.
   - Remove any absolute positioning or grid layouts intended for side panels found in the legacy Figma design.

3. **Phase 3: GoongAPI Integration**
   - Implement `PublicDonationMap` using `Leaflet` and `@maplibre/maplibre-gl-leaflet` to match the project's existing map pattern in `InteractiveMapPage.tsx`.
   - Initialize the map centered on HCMC.
   - Iterate over the static data array to plot markers.
   - Provide a distinct visual marker styling (e.g., specific color, icon shape) for the LifeLine HQ.

4. **Phase 4: Popups and Interactivity**
   - Bind Leaflet popups to each marker to display the `name` and `address` on click.
   - Handle Goong API key fallbacks gracefully (e.g., render standard OSM tiles if Goong fails or key is missing).

## Assumptions & Open Questions

- **GoongAPI Key**: Dependent on `VITE_GOONG_API_KEY` stored in `.env`. If missing, the map will gracefully degrade to OpenStreetMap tiles or show a fallback message.
