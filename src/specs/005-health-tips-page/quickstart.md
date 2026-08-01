# Quickstart: Health Tips Page Validation

## Prerequisites
* The LifeLine frontend application is running locally.

## Validation Scenarios

### Scenario 1: Page Rendering & Layout
1. Navigate to `http://localhost:5173/health-tips`.
2. **Expected Outcome**:
   * The page renders without errors.
   * The Featured Article section is visible at the top.
   * The Tip Cards are displayed in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile).
   * The FAQ section is visible at the bottom.
   * There is **no search bar** anywhere on the page.

### Scenario 2: FAQ Interaction
1. Scroll down to the FAQ section.
2. Click on the first FAQ question.
3. **Expected Outcome**: The answer expands gracefully, pushing the content below it down.
4. Click the same question again.
5. **Expected Outcome**: The answer collapses.

### Scenario 3: Localization Toggle
1. Using the application's language switcher (in the Header or Footer), change the language from Vietnamese to English (or vice versa).
2. **Expected Outcome**:
   * All static text on the Health Tips page updates immediately to the selected language.
   * Long translations in the FAQ section wrap correctly without breaking the layout.
