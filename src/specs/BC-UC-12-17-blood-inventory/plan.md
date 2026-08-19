# Implementation Plan: Blood Inventory Management (BC-UC-12 → BC-UC-17)

> **Feature Directory**: `specs/BC-UC-12-17-blood-inventory`
> **Module Paths**:
> - Frontend: `src/frontend/src/modules/blood-inventory/`
> - Backend: `src/backend-core/src/modules/blood-inventory/`
> **Constraint**: Strict **ADDITIVE-ONLY**. No existing code, routes, or schemas altered or deleted.

---

## 1. Technical Context & Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4 + `@tanstack/react-query` + Axios + Recharts
- **Backend**: Node.js + Express 5 + TypeScript (`tsx watch`) + Mongoose ODM
- **Database**: MongoDB Atlas (`blood_bags` collection)

---

## 2. Design Artifacts & Specifications Summary

- 📄 [`spec.md`](spec.md): Approved requirements for BC-UC-12 through BC-UC-17
- 🔬 [`research.md`](research.md): Technical context, FEFO sorting logic, Recharts selection
- 🗄️ [`data-model.md`](data-model.md): `BloodBag` entity, Mongoose schema, validation rules, state transitions
- 🔌 [`contracts/inventory-api.md`](contracts/inventory-api.md): REST API contracts for 6 inventory endpoints
- 🚀 [`quickstart.md`](quickstart.md): Runnable validation scenarios and test setup

---

## 3. Implementation Breakdown by Phase

### Phase 1: Data Model & Backend Core API (Additive Only)
- **Backend Model**:
  - `src/backend-core/src/modules/blood-inventory/models/blood-bag.model.ts`
- **Backend Schemas & Validation**:
  - `src/backend-core/src/modules/blood-inventory/schemas/inventory.schema.ts`
- **Backend Service & Controller**:
  - `src/backend-core/src/modules/blood-inventory/inventory.service.ts`
  - `src/backend-core/src/modules/blood-inventory/inventory.controller.ts`
- **Backend Routes**:
  - `src/backend-core/src/modules/blood-inventory/inventory.routes.ts`

### Phase 2: Frontend Shared Components & Hooks (Additive Only)
- **Frontend Types**:
  - `src/frontend/src/modules/blood-inventory/types/inventory.types.ts`
- **Frontend API Service & Hooks**:
  - `src/frontend/src/modules/blood-inventory/services/inventoryApi.ts`
  - `src/frontend/src/modules/blood-inventory/hooks/useInventory.ts`
- **Shared UI Components**:
  - `src/frontend/src/modules/blood-inventory/components/BloodBagStatusBadge.tsx`
  - `src/frontend/src/modules/blood-inventory/components/BloodTypeBadge.tsx`
  - `src/frontend/src/modules/blood-inventory/components/DaysRemainingProgressBar.tsx`
  - `src/frontend/src/modules/blood-inventory/components/BloodBagSearchFilter.tsx`

### Phase 3: Page-Level Components & Feature Flows (Additive Only)
- **Pages**:
  - `src/frontend/src/modules/blood-inventory/pages/InventoryListPage.tsx` (BC-UC-12, BC-UC-13)
  - `src/frontend/src/modules/blood-inventory/pages/BloodBagDetailPage.tsx` (BC-UC-14)
  - `src/frontend/src/modules/blood-inventory/pages/StockInPage.tsx` (BC-UC-15)
  - `src/frontend/src/modules/blood-inventory/pages/StockOutPage.tsx` (BC-UC-16)
  - `src/frontend/src/modules/blood-inventory/pages/InventoryStatsPage.tsx` (BC-UC-17)
- **Sub-components**:
  - `src/frontend/src/modules/blood-inventory/components/StatusEditModal.tsx`
  - `src/frontend/src/modules/blood-inventory/components/FefoRecommendationPanel.tsx`
  - `src/frontend/src/modules/blood-inventory/components/InventoryAnalyticsChart.tsx`

---

## 4. Read-Only Integration Points & Minimal Routing Additions

1. **Backend Main App (`src/backend-core/src/app.ts`)**:
   - *Minimal Addition*: Register new route middleware `app.use('/api/v1/bc/inventory', inventoryRoutes)`.
2. **Frontend App Router (`src/frontend/src/App.tsx`)**:
   - *Minimal Addition*: Mount new route pages under existing `/bc/` layout.

---

## 5. Rollback Plan

Because all code is created within isolated module folders:
- **Backend Rollback**: Delete `src/backend-core/src/modules/blood-inventory/` and unmount route in `app.ts`.
- **Frontend Rollback**: Delete `src/frontend/src/modules/blood-inventory/` and remove routes from `App.tsx`.
- **Database Rollback**: Drop `blood_bags` collection in MongoDB.

---

## 6. Constitution Check

- ✅ **Additive Only**: All new features isolated to dedicated module folders.
- ✅ **No Breaking Changes**: Existing APIs, schemas, and routes remain 100% untouched.
- ✅ **Verification Ready**: E2E test scenarios documented in `quickstart.md`.
