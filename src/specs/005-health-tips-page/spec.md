# Feature Specification: Health Tips Page

## 1. Summary
The "Health Tips" page serves as a static resource hub offering medical guidance, nutritional advice, hydration schedules, and recovery tips for blood donors. The page is purely informational and read-only. It replaces the complex, mixed-language reference implementation with a clean, fully localized, responsive design that excludes unnecessary interactive elements like search bars.

## 2. User Scenarios & Testing

### 2.1. View Health Tips Resources (Basic Flow)
* **Preconditions**: The user navigates to the LifeLine web application.
* **Steps**:
  1. User clicks the "Health Tips" link in the global navigation menu.
  2. The system renders the Health Tips page.
  3. User views the Featured Article ("Pre-Donation Prep Guide").
  4. User browses the 6 categorized tip cards (e.g., Nutrition, Hydration, Recovery).
  5. User scrolls down and clicks on an FAQ item to expand it and read the answer.
* **Postconditions**: The user has successfully consumed the static informational content.

## 3. Functional Requirements

### 3.1. Content Rendering & Data Mapping
* **Description**: The page must dynamically render its content (tip cards, FAQ items) by mapping over static data arrays defined within the application, rather than hardcoding HTML structures.
* **Acceptance Criteria**:
  * The codebase contains static arrays or objects representing the 6 tip cards and 3 FAQ items.
  * The UI components iterate over these arrays to render the layout.

### 3.2. Localization (i18next)
* **Description**: The page must fully support bilingual rendering (English and Vietnamese) via `i18next`. All hardcoded text, especially the currently mixed language text (e.g., "MEDICAL GUIDANCE" vs "Lời khuyên chuyên gia"), must be replaced with translation keys.
* **Acceptance Criteria**:
  * No hardcoded user-facing text exists in the component.
  * Toggling the application language switches all text on the Health Tips page appropriately.

### 3.3. Removal of Search Functionality
* **Description**: The search bar component shown in the prototype and reference code MUST be completely excluded from the implementation.
* **Acceptance Criteria**:
  * There is no search input field rendered on the page.
  * There is no search filtering state or logic present in the component.

## 4. Non-Functional Requirements

### 4.1. Responsive Layout (Tailwind CSS)
* **Description**: The page must utilize standard Tailwind CSS Grid and Flexbox utilities to ensure fluid responsiveness across mobile, tablet, and desktop viewports.
* **Acceptance Criteria**:
  * Hardcoded absolute positioning classes (e.g., `absolute right-0`, `absolute left-[213px]`) are strictly forbidden and removed.
  * The layout naturally flows and stacks (e.g., grid columns reduce from 3 on desktop to 1 on mobile).

## 5. Acceptance Criteria

* The "Health Tips" navigation link in the Header correctly routes to this page and displays as active.
* The search bar is completely absent.
* The featured article block renders correctly.
* Exactly 6 categorization cards (e.g., "What to Eat Before and After", "Iron-Rich Foods") render correctly using mapped placeholder text.
* Exactly 3 FAQ accordion items render correctly using mapped placeholder text and can be toggled open/closed.

## 6. Edge Cases & Error Handling

* **Missing Images**: If the featured article thumbnail or category card images fail to load or are missing from the static data, the UI must display a graceful fallback placeholder or colored skeleton without breaking the layout.
* **Long Translation Strings**: If an FAQ question or answer contains extremely long text (e.g., in Vietnamese), the text must gracefully wrap to the next line without overflowing the container or breaking the accordion toggle.
* **Layout Stability**: The tip cards grid must maintain structural stability (e.g., aligned rows, equal heights) even if an odd number of cards (e.g., 5 or 7) are eventually provided in the static data array.

## 7. Assumptions
* The featured article click action does not navigate to a new page in this iteration (it is a static UI placeholder).
* The FAQ toggle state is managed locally within the component and does not require URL routing.
