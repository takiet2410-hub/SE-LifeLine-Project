# Quickstart Validation: How It Works Page

## Prerequisites
- Node.js environment configured.
- `src/frontend` dependencies installed via `npm install`.

## Run the Application
1. Navigate to the frontend directory: `cd src/frontend`
2. Start the Vite development server: `npm run dev`
3. Open a browser and navigate to: `http://localhost:5173/how-it-works`

## Validation Scenarios

1. **Routing & Layout Verification**
   - Click "How It Works" in the Header navigation.
   - **Expected**: The route changes to `/how-it-works`. The "How It Works" link in the header is highlighted with a bottom border (or active state styling). The page renders the Layout (Header and Footer).

2. **Responsive Rendering Check**
   - Shrink the browser window to mobile width (<768px).
   - **Expected**: The 4 Journey Step cards and 4 Eligibility cards stack vertically or adapt dynamically to the grid (e.g., `grid-cols-1`). No text is cut off. No horizontal scrollbar appears.
   - Expand the browser window to desktop width (>1024px).
   - **Expected**: The cards layout in a horizontal grid (e.g., `grid-cols-4` or `grid-cols-2`).

3. **Localization Toggle Check**
   - Click the language toggle button in the header (EN/VI).
   - **Expected**: All text strings in the page immediately switch to the selected language without breaking the layout. The mixed language content from the Figma mockups is replaced entirely by the active locale's translation.

4. **CTA Navigation Check**
   - Scroll to the bottom of the page and click "Sign Up Now" in the Call to Action section.
   - **Expected**: The browser correctly navigates to the `/register` route.
