# Quickstart Validation Guide: Find Locations Map

This guide outlines how to manually validate that the "Find Locations" interactive map feature functions according to the specifications.

## Prerequisites

- Frontend dependency installation (`npm install` inside `src/frontend`).
- A valid Goong API key added to `src/frontend/.env` as `VITE_GOONG_API_KEY`.
- The development server running (`npm run dev` in `src/frontend`).

## Validation Scenarios

### Scenario 1: Verify Full-Screen Layout

1. **Action**: Navigate to `http://localhost:5173/find-locations` (or whatever path the router maps to the new `FindLocationsPage`).
2. **Expectation**: The map occupies 100% of the screen width and height below the global navigation bar.
3. **Expectation**: There are NO search input fields, NO side panels, NO list of hospitals, and NO filtering dropdowns visible anywhere on the page.

### Scenario 2: Verify Static Markers

1. **Action**: Inspect the rendered map on the screen.
2. **Expectation**: You should see exactly 7 markers plotted in the Ho Chi Minh City area.
3. **Expectation**: One of the markers (located at 227 Nguyễn Văn Cừ) MUST have a distinctly different visual style (e.g., color, shape) indicating it is the LifeLine HQ.

### Scenario 3: Verify Tooltips/Popups

1. **Action**: Click on the distinct LifeLine HQ marker.
2. **Expectation**: A popup appears displaying "LifeLine Headquarters" and its address.
3. **Action**: Click on any of the other 6 standard donation center markers.
4. **Expectation**: A popup appears displaying the respective center's name and address.
5. **Action**: Click on an empty area of the map.
6. **Expectation**: The currently open popup closes.

### Scenario 4: Verify Interactivity

1. **Action**: Click and drag the map.
2. **Expectation**: The map pans smoothly.
3. **Action**: Use the scroll wheel (or pinch-to-zoom on mobile/trackpad).
4. **Expectation**: The map zooms in and out smoothly.

## Troubleshooting

- **Blank Map**: Ensure `VITE_GOONG_API_KEY` is set correctly. If missing, check if the component falls back gracefully to OpenStreetMap tiles.
- **Markers Not Showing**: Verify the static data array is correctly passed to the map initialization logic and that Leaflet marker icons are loading.
