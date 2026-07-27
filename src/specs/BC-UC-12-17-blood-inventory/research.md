# Research: Blood Inventory Management (BC-UC-12 → BC-UC-17)

## 1. Technical Context & Stack Confirmation

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Node.js + Express 5 + TypeScript (`tsx watch`)
- **Database**: MongoDB (Mongoose ODM)
- **State & Data Fetching**: React Query (`@tanstack/react-query`) + Axios
- **Form Validation**: React Hook Form + Zod
- **UI Components & Icons**: Lucide React (`lucide-react`) + Sonner (toasts) + Recharts (charts)

---

## 2. Technical Decisions & Rationale

### Decision 1: FEFO (First Expired, First Out) Sorting & Recommendation Engine
- **Choice**: Server-side default sorting (`expiryDate ASC`) combined with client-side recommendation filter.
- **Rationale**: FEFO minimizes blood bag waste. Sorting by `expiryDate ASC` ensures the oldest usable blood is presented first.
- **Alternatives Considered**: Client-only sorting (fails when pagination is active).

### Decision 2: Charting Engine for Inventory Statistics (BC-UC-16)
- **Choice**: `recharts` (v2.12+).
- **Rationale**: Already declared in `frontend/package.json`, provides native React SVG components, supports `ResponsiveContainer`, `BarChart`, and `PieChart`.

### Decision 3: Additive Architecture Pattern
- **Choice**: Strictly new modules (`src/frontend/src/modules/blood-inventory/` and `src/backend-core/src/modules/blood-inventory/`).
- **Rationale**: Prevents regressions or breaking existing code, satisfies project constitution and non-destructive requirements.

### Decision 4: Status Transition Enforcement
- **Choice**: Terminal state protection in both model schema and UI components.
- **Rules**:
  - `Available` → `Reserved`, `Used`, `Expired`, `Discarded`
  - `Reserved` → `Available`, `Used`, `Discarded`
  - `Used`, `Expired`, `Discarded` → Terminal (No transition allowed)
