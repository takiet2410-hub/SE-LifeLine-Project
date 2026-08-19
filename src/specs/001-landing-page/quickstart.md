# Quickstart Validation Guide: Landing Page

## Prerequisites
- Node.js installed
- Project dependencies installed (`npm install` inside `src/frontend`)

## Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to the local server address (typically `http://localhost:5173`).

## Validation Steps
1. **Responsiveness Test**: Resize the browser window from full desktop width down to 320px (mobile). Verify that horizontal scrolling does not appear and that the layout reflows properly (e.g., 3-column features collapse into a single column).
2. **Navigation Link Test**: Click on "Sign Up Now" or "Login" in the global header to ensure the router catches the path change (even if the target page is blank for now).
3. **Localization Test**: If the language toggle is hooked up to i18next, click the language switcher in the Header and verify the text changes to Vietnamese.
