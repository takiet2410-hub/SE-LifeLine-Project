# Research: Landing Page & Global Navigation

## Decision 1: Routing Library
- **Decision**: `react-router-dom`
- **Rationale**: Standard routing solution for React Single Page Applications (SPAs). It allows client-side navigation without full page reloads, satisfying the requirement to connect the landing page to other modules (e.g., login, map).
- **Alternatives considered**: Next.js routing (Not applicable as the constraint specifies React + Vite).

## Decision 2: Layout Refactoring (Eradicating Absolute Positioning)
- **Decision**: Tailwind CSS Flexbox and Grid.
- **Rationale**: The provided auto-generated code uses brittle fixed positioning (`absolute top-[661px]`) which breaks on varying viewports. Using fluid layout primitives ensures `NFR-U-01` (mobile/tablet/desktop responsiveness) is met.
- **Alternatives considered**: Custom CSS files (Violates the Constitution's mandate to use Tailwind CSS).
