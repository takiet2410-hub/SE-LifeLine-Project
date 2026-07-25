# Plan: BC-UC-12 → BC-UC-17 — Blood Inventory Management (Frontend)

> **Module**: `src/frontend/src/modules/blood-inventory/`
> **Stack**: React + TypeScript (strict) + Tailwind CSS + React Query + recharts + i18next
> **Reference**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-12-17-blood-inventory/spec.md)

---

## 1. Component Architecture

```
src/frontend/src/modules/blood-inventory/
├── pages/
│   ├── InventoryListPage.tsx          # BC-UC-12 main page (table + summary cards)
│   ├── BloodBagDetailPage.tsx         # BC-UC-14 view/edit blood bag status
│   ├── StockInPage.tsx                # BC-UC-15 multi-entry form
│   ├── StockOutPage.tsx               # BC-UC-16 selection + reason form
│   └── InventoryStatsPage.tsx         # BC-UC-17 charts + dashboard
│
├── components/
│   ├── InventorySummaryCards.tsx       # Stat cards (total, available, near-expiry, low-stock)
│   ├── BloodBagTable.tsx              # Paginated, sortable inventory table
│   ├── BloodBagSearchFilter.tsx       # Search bar + multi-filter (type, status, date)
│   ├── BloodBagStatusBadge.tsx        # Available/Reserved/Used/Expired/Discarded
│   ├── BloodTypeBadge.tsx             # A+, A-, B+, etc. color-coded
│   ├── BloodBagInfoCard.tsx           # Read-only detail card
│   ├── StatusHistoryTimeline.tsx      # Chronological status change log
│   ├── StatusEditForm.tsx             # Dropdown + reason + save/cancel
│   ├── StockInEntryRow.tsx            # Single blood bag entry in Stock In form
│   ├── StockInForm.tsx                # Dynamic multi-entry form
│   ├── StockOutSelectionList.tsx      # Checkbox selection list for stock out
│   ├── StockOutReasonForm.tsx         # Reason dropdown + notes
│   ├── InventoryBarChart.tsx          # Units by blood type bar chart (recharts)
│   ├── InventoryDoughnutChart.tsx     # Blood type distribution pie/doughnut (recharts)
│   ├── InventoryStatsTable.tsx        # Summary table per blood type
│   ├── ChartModeToggle.tsx            # Toggle: Units / Volume / Near-Expiry
│   ├── LowStockWarning.tsx            # Warning indicator for low-stock blood types
│   └── NearExpiryWarning.tsx          # Warning indicator for near-expiry units
│
├── hooks/
│   ├── useInventory.ts                # React Query: GET /api/v1/bc/inventory
│   ├── useBloodBag.ts                 # React Query: GET /api/v1/bc/inventory/:id
│   ├── useUpdateBloodBagStatus.ts     # React Query mutation: PUT status
│   ├── useStockIn.ts                  # React Query mutation: POST stock-in
│   ├── useStockOut.ts                 # React Query mutation: POST stock-out
│   ├── useInventoryStats.ts           # React Query: GET /api/v1/bc/inventory/statistics
│   └── useBloodBagSearch.ts           # Debounced search within inventory
│
├── schemas/
│   ├── stockInSchema.ts               # Zod schema for stock-in entries
│   ├── stockOutSchema.ts              # Zod schema for stock-out
│   └── statusUpdateSchema.ts          # Zod schema for status change
│
├── types/
│   └── inventory.types.ts             # BloodBag, StockInEntry, InventoryStats, etc.
│
└── i18n/
    ├── inventory.vi.json
    └── inventory.en.json
```

---

## 2. Routing Plan

```typescript
const inventoryRoutes = [
  { path: '/bc/inventory',                  element: <InventoryListPage /> },      // BC-UC-12, BC-UC-13
  { path: '/bc/inventory/stats',            element: <InventoryStatsPage /> },     // BC-UC-17
  { path: '/bc/inventory/stock-in',         element: <StockInPage /> },            // BC-UC-15
  { path: '/bc/inventory/stock-out',        element: <StockOutPage /> },           // BC-UC-16
  { path: '/bc/inventory/:bagId',           element: <BloodBagDetailPage /> },     // BC-UC-14
];
```

---

## 3. API Integration

| Method | Path | UC | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/bc/inventory` | BC-UC-12/13 | List blood bags (paginated, filterable) |
| GET | `/bc/inventory/statistics` | BC-UC-17 | Get inventory statistics |
| GET | `/bc/inventory/:bagId` | BC-UC-14 | Get blood bag detail |
| PUT | `/bc/inventory/:bagId/status` | BC-UC-14 | Update blood bag status |
| POST | `/bc/inventory/stock-in` | BC-UC-15 | Stock in (batch) |
| POST | `/bc/inventory/stock-out` | BC-UC-16 | Stock out (batch) |

---

## 4. Validation Schemas (Zod)

```typescript
// stockInSchema.ts
import { z } from 'zod';

export const stockInEntrySchema = z.object({
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  volumeMl: z.number().positive('Volume must be > 0'),
  collectionDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  storageLocation: z.string().min(1, 'Storage location is required'),
}).refine(data => new Date(data.expiryDate) > new Date(data.collectionDate), {
  message: 'Expiry date must be after collection date',
  path: ['expiryDate'],
});

export const stockInBatchSchema = z.object({
  entries: z.array(stockInEntrySchema).min(1, 'At least one blood bag entry is required'),
});

export type StockInEntry = z.infer<typeof stockInEntrySchema>;
export type StockInBatch = z.infer<typeof stockInBatchSchema>;
```

```typescript
// stockOutSchema.ts
export const stockOutSchema = z.object({
  bagIds: z.array(z.string()).min(1, 'Select at least one blood bag'),
  reason: z.enum(['Dispatch', 'Disposal', 'Transfer', 'Other']),
  notes: z.string().optional(),
});

export type StockOutInput = z.infer<typeof stockOutSchema>;
```

---

## 5. Chart Library

**Recommendation: `recharts`**

| Feature | recharts | chart.js |
| :--- | :--- | :--- |
| React-native support | ✅ Built for React | ⚠ Wrapper needed |
| TypeScript | ✅ Native | ⚠ Community types |
| Customization | ✅ Component-based | ⚠ Config-based |
| Bundle size | ~45KB | ~60KB |
| Responsive | ✅ ResponsiveContainer | ⚠ Manual |

Dependencies: `recharts`

Charts needed:
- `<BarChart>` — blood units by type
- `<PieChart>` — blood type distribution
- `<ResponsiveContainer>` — wrapper for responsive sizing

---

## 6. Status Transition Matrix (for BC-UC-14)

Valid status transitions enforced in the UI dropdown:

| Current Status | Can Change To |
| :--- | :--- |
| Available | Reserved, Used, Expired, Discarded |
| Reserved | Available, Used, Discarded |
| Used | *(No transitions — terminal state)* |
| Expired | *(No transitions — terminal state, AF-02)* |
| Discarded | *(No transitions — terminal state)* |

The `StatusEditForm` component must only show valid next-states based on current status.
