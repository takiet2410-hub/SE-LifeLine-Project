# Technical Research: About Us Page

## Component Architecture
- **Decision**: Break the page into modular components: `AboutMission.tsx`, `AboutStats.tsx`, `AboutStory.tsx`, and `AboutCoreValues.tsx`. Place them under `src/frontend/src/modules/landing-page/components/about/`.
- **Rationale**: Keeps the main `AboutUsPage.tsx` clean and enforces reusability. Adheres to the established frontend structure.
- **Alternatives considered**: Keeping everything in one `AboutUsPage.tsx` file (rejected to avoid repeating the monolithic Figma export structure).

## Layout & Styling (Tailwind CSS)
- **Decision**: Strictly use responsive Tailwind grid/flex utilities. Specifically, replace all absolute positioning (e.g., `absolute left-[179px]`) with flex layouts, relying on `max-w-[1280px]` and `mx-auto` for centering.
- **Rationale**: Meets the Non-Functional Requirement (NFR-002) to remove absolute positioning and ensures mobile-friendliness.
- **Alternatives considered**: Using custom CSS files (rejected to maintain Tailwind consistency).

## Localization Strategy
- **Decision**: Use `i18next` with `useTranslation()` hook. Create specific keys in `landing.json` under an `about` node (e.g., `about.mission.title`).
- **Rationale**: Reuses the existing `i18next` setup for the landing page module.
- **Alternatives considered**: Storing translations directly in component state (rejected due to lack of scalability).
