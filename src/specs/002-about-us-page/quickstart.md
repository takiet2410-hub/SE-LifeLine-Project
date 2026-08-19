# Quickstart Validation: About Us Page

## Prerequisites
- Node.js environment configured.
- `src/frontend` dependencies installed via `npm install`.

## Run the Application
1. Navigate to the frontend directory: `cd src/frontend`
2. Start the Vite development server: `npm run dev`
3. Open a browser and navigate to: `http://localhost:5173/about`

## Validation Scenarios

1. **Routing & Layout Verification**
   - Click "About Us" in the Header navigation.
   - **Expected**: The route changes to `/about`. The "About Us" link in the header is highlighted with a bottom border. The page renders the Layout (Header and Footer).

2. **Responsive Rendering Check**
   - Shrink the browser window to mobile width (<768px).
   - **Expected**: The 3 Core Value cards stack vertically. No text is cut off. No horizontal scrollbar appears.

3. **Localization Toggle Check**
   - Click the language toggle button in the header (EN/VI).
   - **Expected**: All text strings in the About Us page (Mission, Story, Values) immediately switch to the selected language without breaking the layout.

4. **CTA Navigation Check**
   - Scroll to the bottom of the page and click "Sign Up Now".
   - **Expected**: The browser correctly navigates to the `/register` route.
