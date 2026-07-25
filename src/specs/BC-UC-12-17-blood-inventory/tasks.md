# Tasks: BC-UC-12 → BC-UC-17 — Blood Inventory Management (Frontend)

> **Reference**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-12-17-blood-inventory/spec.md) | [plan.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-12-17-blood-inventory/plan.md)
> **Branch**: `feature/BC-UC-12-17-blood-inventory`

---

## Phase 0: Setup

- [ ] **T-0.1**: Install chart library — `recharts`
- [ ] **T-0.2**: Create i18n files — `inventory.vi.json`, `inventory.en.json`
- [ ] **T-0.3**: Create Zod schemas — `stockInSchema.ts`, `stockOutSchema.ts`, `statusUpdateSchema.ts`
- [ ] **T-0.4**: Create TypeScript types — `inventory.types.ts`

---

## Phase 1: Inventory List & Search (BC-UC-12, BC-UC-13)

- [ ] **T-1.1**: Create hooks — `useInventory.ts`, `useBloodBagSearch.ts`
- [ ] **T-1.2**: Build `BloodBagStatusBadge.tsx` — Available/Reserved/Used/Expired/Discarded
- [ ] **T-1.3**: Build `BloodTypeBadge.tsx` — color-coded blood type chips
- [ ] **T-1.4**: Build `InventorySummaryCards.tsx` — total bags, available, near-expiry, low-stock
- [ ] **T-1.5**: Build `BloodBagSearchFilter.tsx` — search + multi-filter (type, status, date range)
- [ ] **T-1.6**: Build `BloodBagTable.tsx` — columns: ID, type, volume, dates, status, location, actions
  - Highlight near-expiry rows (≤ 7 days) with amber/red row background
- [ ] **T-1.7**: Build `InventoryListPage.tsx` (BC-UC-12 / BC-UC-13)
  - Action buttons: Stock In, Stock Out, Statistics
  - Summary cards + search/filter + table + pagination
  - Empty state

---

## Phase 2: Blood Bag Detail & Status Edit (BC-UC-14)

- [ ] **T-2.1**: Create hooks — `useBloodBag.ts`, `useUpdateBloodBagStatus.ts`
- [ ] **T-2.2**: Build `BloodBagInfoCard.tsx` — read-only detail card
- [ ] **T-2.3**: Build `StatusHistoryTimeline.tsx` — chronological status changes
- [ ] **T-2.4**: Build `StatusEditForm.tsx`
  - Dropdown shows only valid transitions from current status
  - Reason text input
  - Save/Cancel buttons
  - Disabled state for Expired bags (AF-02)
- [ ] **T-2.5**: Build `BloodBagDetailPage.tsx` (BC-UC-14)
  - View mode: info card + status badge + history timeline
  - Edit mode: StatusEditForm
  - Loading/NotFound/Error states
  - Success/Error toast on update

---

## Phase 3: Stock In (BC-UC-15)

- [ ] **T-3.1**: Create hook — `useStockIn.ts`
- [ ] **T-3.2**: Build `StockInEntryRow.tsx`
  - Fields: Blood Type, Volume, Collection Date, Expiry Date, Storage Location
  - Remove button (if > 1 entry)
  - Inline validation
- [ ] **T-3.3**: Build `StockInForm.tsx`
  - Dynamic list of `StockInEntryRow` components
  - "Add Another Blood Bag" button
  - React Hook Form + Zod with `useFieldArray`
- [ ] **T-3.4**: Build `StockInPage.tsx` (BC-UC-15)
  - StockInForm wrapper
  - "Stock In" submit button → mutation (all-or-nothing)
  - "Cancel" → discard confirmation dialog
  - Success toast with count of bags added
  - Redirect to inventory list on success

---

## Phase 4: Stock Out (BC-UC-16)

- [ ] **T-4.1**: Create hook — `useStockOut.ts`
- [ ] **T-4.2**: Build `StockOutSelectionList.tsx`
  - Blood bag list with checkboxes (only "Available" status bags)
  - Search/filter integration (reuse `BloodBagSearchFilter`)
  - Selected count indicator
  - Default sort: FEFO (First Expired, First Out)
- [ ] **T-4.3**: Build `StockOutReasonForm.tsx`
  - Reason dropdown: Dispatch, Disposal, Transfer, Other
  - Additional notes textarea
- [ ] **T-4.4**: Build `StockOutPage.tsx` (BC-UC-16)
  - Left: Selection list with search/filter
  - Right/Bottom: Selected summary + reason form
  - "Confirm Stock Out" button → mutation
  - "Cancel" → discard
  - Success toast + redirect

---

## Phase 5: Inventory Statistics Dashboard (BC-UC-17)

- [ ] **T-5.1**: Create hook — `useInventoryStats.ts`
- [ ] **T-5.2**: Build `InventoryBarChart.tsx`
  - recharts `<BarChart>` — blood units by type
  - Responsive wrapper
- [ ] **T-5.3**: Build `InventoryDoughnutChart.tsx`
  - recharts `<PieChart>` — blood type distribution
- [ ] **T-5.4**: Build `ChartModeToggle.tsx`
  - Toggle between: Units, Volume, Near-Expiry (AF-03)
- [ ] **T-5.5**: Build `InventoryStatsTable.tsx`
  - Columns: Blood Type, Total Units, Volume (ml), Near-Expiry, Stock Status
  - Low-stock rows: amber background, "Low Stock" badge
  - Critical rows: red background, "Critical" badge
- [ ] **T-5.6**: Build `LowStockWarning.tsx` + `NearExpiryWarning.tsx`
  - Amber/red alert banners at top of dashboard
- [ ] **T-5.7**: Build `InventoryStatsPage.tsx` (BC-UC-17)
  - Summary cards + warning indicators
  - Charts section (bar + doughnut side-by-side) + mode toggle
  - Stats table below charts
  - Loading skeleton state

---

## Phase 6: Integration & Polish

- [ ] **T-6.1**: Wire up navigation flows
  - Inventory List → Stock In / Stock Out / Statistics / Blood Bag Detail
  - Stock In/Out success → redirect to Inventory List
  - Breadcrumb navigation on all pages
- [ ] **T-6.2**: Add i18n translations
- [ ] **T-6.3**: Responsive design pass (table → card on mobile)
- [ ] **T-6.4**: Accessibility pass (ARIA labels, keyboard nav, color contrast)

---

## Phase 7: Verification

- [ ] **T-7.1**: Type check — `npx tsc --noEmit`
- [ ] **T-7.2**: Lint — `npm run lint`
- [ ] **T-7.3**: Visual QC vs Figma reference
  - Verify inventory table matches Figma layout
  - Verify charts match Figma dashboard design
  - Verify dark navy header in inventory table (if intentional)
- [ ] **T-7.4**: Functional tests
  - Inventory list + search + filter
  - Blood bag detail + edit status (valid transitions only)
  - Stock In: add multiple, validate, submit, verify auto-generated ID
  - Stock Out: select, set reason, confirm
  - Statistics: chart render, mode toggle, warning indicators
- [ ] **T-7.5**: Update Spec-Kit artifacts
