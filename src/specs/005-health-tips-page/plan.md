# Implementation Plan: Health Tips Page

## 1. Technical Context

This plan outlines the implementation of the Health Tips page, refactoring a monolithic, absolute-positioned Figma-to-code prototype into a clean, modular React component tree. The implementation focuses strictly on static content delivery and removes unnecessary interactive elements like the search bar.

### Core Stack
* **Framework:** React (Vite)
* **Language:** TypeScript (`strict: true`)
* **Styling:** Tailwind CSS (Grid and Flexbox layouts)
* **Localization:** `i18next`

## 2. Architecture Overview

The monolithic Figma code will be broken down into a modular React component tree. These components will be placed within the `content-news` module folder, which owns content and articles, supporting our isolated folder structure and 5-person concurrent workflow.

**Component Tree Strategy:**
* `HealthTipsPage` (Main Page Component)
  * `FeaturedArticle`: Renders the "Pre-Donation Prep Guide" spotlight section.
  * `TipCategoryGrid`: A responsive grid container mapping over `HEALTH_TIPS_DATA`.
    * `TipCard`: Individual card component displaying a category (e.g., Nutrition, Hydration).
  * `FAQAccordion`: A vertical flex container mapping over `FAQ_DATA`.
    * `FAQItem`: Individual question/answer component with basic expand/collapse state.

**CRITICAL DEVIATION:** The search bar component from the prototype is entirely **EXCLUDED**.

## 3. Technology Stack & Layout Refactoring Strategy

* **Tailwind CSS Enforcement:** All hardcoded absolute positioning classes from the Figma output (e.g., `absolute left-[213px]`, `absolute right-0`) will be **eradicated**.
* **Tip Cards Layout:** We will utilize Tailwind CSS Grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`) to create a fluid, responsive grid for the categorization cards.
* **FAQ Section Layout:** We will use Flexbox (`flex flex-col gap-4`) for the FAQ section to ensure vertical stacking and fluid height adjustments when items expand.

## 4. Data & State Management

Content will be abstracted into strongly typed constant arrays rather than hardcoded inside JSX. This ensures clean mapping and easy localization.

**TypeScript Interfaces:**
```typescript
export interface TipCardProps {
  id: string;
  titleKey: string;      // i18next key
  descriptionKey: string; // i18next key
  iconName: string;
  imageFallbackUrl: string;
}

export interface FAQItemProps {
  id: string;
  questionKey: string;   // i18next key
  answerKey: string;     // i18next key
}
```

**Constant Arrays:**
* `HEALTH_TIPS_DATA: TipCardProps[]`: Contains the 6 static tip categories.
* `FAQ_DATA: FAQItemProps[]`: Contains the 3 static FAQ items.

**State Management:**
* No complex search or filtering state (`useState`) will be used.
* The only local state required is `isExpanded` (boolean) within the atomic `<FAQItem />` component to toggle the accordion answer.

## 5. Implementation Sequence

### Phase 1: Models & Data Setup
* Define TypeScript interfaces (`TipCardProps`, `FAQItemProps`) in the `types/` folder or within the `content-news` module.
* Create the static data arrays (`HEALTH_TIPS_DATA`, `FAQ_DATA`) containing `i18next` translation keys.

### Phase 2: Atomic UI Components
* Build the `<TipCard />` component using Tailwind flex layout for internal content.
* Build the `<FAQItem />` component with basic `useState` for toggling visibility.
* Build the `<FeaturedArticle />` component.

### Phase 3: Page-Level Assembly
* Assemble the `HealthTipsPage` layout.
* Implement `<TipCategoryGrid />` using `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
* Implement `<FAQAccordion />` using `flex-col`.
* Ensure all absolute positioning is removed and the layout is controlled entirely by Flex/Grid containers.

### Phase 4: Localization & Polish
* Integrate `useTranslation` from `react-i18next`.
* Map the static data arrays to render the translated strings.
* Perform responsive testing across mobile, tablet, and desktop viewports.
* Verify graceful handling of missing images and extremely long translated strings.

## 6. Constitution Verification

* **Strict TypeScript:** Enforced (`strict: true`). Interfaces clearly defined.
* **Module Boundaries:** Components and data will be housed within the `src/modules/content-news` boundary.
* **Component Naming:** Follows PascalCase naming conventions for React components per `CodingConventions.md`.

## 7. Assumptions & Open Questions

* **"Đọc Thêm" (Read More) Buttons:** It is assumed that these buttons are purely visual placeholders for this iteration and do not perform routing or open modals. They will simply be rendered as static buttons.
* **Image Assets:** It is assumed placeholder images or Lucide icons will be used for the tip cards.
