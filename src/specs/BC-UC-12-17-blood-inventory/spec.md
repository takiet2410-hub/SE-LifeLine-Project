# Spec: BC-UC-12 → BC-UC-17 — Blood Inventory Management (Frontend)

> **Spec-Kit Artifact** | **Covers**: BC-UC-12 (View Inventory), BC-UC-13 (Search Blood Bag), BC-UC-14 (View/Edit Blood Bag Status), BC-UC-15 (Stock In), BC-UC-16 (Stock Out), BC-UC-17 (Inventory Statistics)
> **Actor**: Blood Center Staff
> **Module**: `src/frontend/src/modules/blood-inventory/`
> **Figma Section**: "Blood Center" → Inventory screens (right column of reference.png)

---

## 1. Figma Reference

- **Figma File**: `https://www.figma.com/design/BkMtRpqqIa0J680q1DukPt/Untitled?node-id=1-29566`
- **Design tokens**: Same as shared LifeLine Blood Center theme

### 1.1 Screens Identified from Figma

| Screen ID | Name | Figma Position | Maps to UC |
| :--- | :--- | :--- | :--- |
| INV-LIST | Blood Inventory Table | Right column, Row 3 | BC-UC-12 |
| INV-SEARCH | Inventory with Search/Filter active | Right column, Row 3 variant | BC-UC-13 |
| INV-STATS | Inventory Statistics Dashboard | Right column, Row 4 | BC-UC-17 |
| INV-BAG-DETAIL | Blood Bag Detail | Right column, Row 5 | BC-UC-14 |
| INV-BAG-EDIT-STATUS | Blood Bag Status Edit | Right column, Row 5 variant | BC-UC-14 (edit) |
| INV-STOCK-IN | Stock In Form | Right column, Row 6 | BC-UC-15 |
| INV-STOCK-IN-CONFIRM | Stock In Confirmation Dialog | Reused ConfirmDialog | BC-UC-15 AF-03 |
| INV-STOCK-OUT | Stock Out Selection Page | Right column, Row 7-8 | BC-UC-16 |
| INV-STOCK-OUT-CONFIRM | Stock Out Confirmation | Right column, Row 7-8 variant | BC-UC-16 |

---

## 2. Screen-by-Screen Functional Requirements

### 2.1 INV-LIST — Blood Inventory Page (BC-UC-12)

**Purpose**: Display current blood inventory with summary stats and action buttons.

**UI Elements**:
- Page title: "Blood Inventory"
- **Action buttons** (top-right):
  - **"Stock In"** (red) → navigates to Stock In form (BC-UC-15)
  - **"Stock Out"** (outlined red) → navigates to Stock Out page (BC-UC-16)
  - **"Statistics"** (outlined) → navigates to Statistics dashboard (BC-UC-17)
- **Inventory Summary Cards** (top section):
  - Total Blood Bags (count)
  - Available Blood Bags (count)
  - (Optionally: Near-Expiry count, Low-Stock warning count)
- **Search bar** + **Filter controls**: by blood bag ID, blood type, status, date range (BC-UC-13)
- **Data table** columns:
  - Blood Bag ID (`bagCode`)
  - Blood Type (badge: A+, B-, etc.)
  - Volume (ml)
  - Collection Date (ISO 8601)
  - Expiry Date (ISO 8601, highlight red if near-expiry ≤ 7 days)
  - Status (badge: Available=green, Reserved=amber, Used=gray, Expired=red, Discarded=slate)
  - Storage Location
  - Actions: View Detail
- **Pagination**
- **Empty State**: "No inventory data available" (AF-06)

**Data Binding** (from `DatabaseSchema.md → BLOOD_BAG`):
```typescript
interface BloodBag {
  _id: string;
  bagCode: string;
  bloodCenterId: string;
  bloodType: string;
  volumeMl: number;
  collectionDate: string;     // ISO 8601
  expiryDate: string;         // ISO 8601
  storageLocation: string;
  status: 'Available' | 'Reserved' | 'Used' | 'Expired' | 'Discarded';
  donorSourceId: string | null;
  campaignSourceId: string | null;
  testResults: object;
  statusHistory: StatusHistoryEntry[];
}

interface StatusHistoryEntry {
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}
```

**API Endpoint**: `GET /api/v1/bc/inventory` (paginated, filterable)

---

### 2.2 INV-SEARCH — Search Blood Bag (BC-UC-13)

**Purpose**: Search and filter blood bags by various criteria.

**UI Behavior**:
- Search bar accepts: Blood Bag ID keyword
- Filter dropdowns: Blood Type, Status, Date Range (collection/expiry)
- Real-time filtering as user selects criteria
- Press "Search" button or Enter to execute
- **Clear icon** to reset all filters (AF-02)
- Results appear in the same table as INV-LIST

**Performance**: Results must return within 2 seconds.

**API Endpoint**: `GET /api/v1/bc/inventory?search=<query>&bloodType=<type>&status=<status>&...`

---

### 2.3 INV-BAG-DETAIL — Blood Bag Detail (BC-UC-14)

**Purpose**: View detailed blood bag information and optionally edit status.

**UI Elements (View Mode)**:
- **Blood Bag Info Card**:
  - Bag ID, Blood Type, Volume (ml), Collection Date, Expiry Date
  - Donor Source (link to donor profile if available)
  - Campaign Source (link to campaign if available)
  - Storage Location
  - Test Results (display as key-value pairs)
- **Current Status**: Large status badge
- **Status History Timeline**: Chronological list of status changes (who, when, from → to)
- **"Edit Status" button** → enables status change (only for non-Expired bags)

**UI Elements (Edit Status Mode)**:
- **Status dropdown**: Only shows valid transitions from current status
  - Available → Reserved, Used, Expired, Discarded
  - Reserved → Available, Used, Discarded
  - (Expired bags cannot be changed — AF-02)
- **Reason field** (text input, optional)
- **"Save" button** + **"Cancel" button**

**Business Rules**:
- If current status is "Expired" → "Edit Status" button disabled, show info message (AF-02)
- Status transitions are logged in `statusHistory` with staff identity, timestamp, reason

**API Endpoints**:
- `GET /api/v1/bc/inventory/:bagId`
- `PUT /api/v1/bc/inventory/:bagId/status`

---

### 2.4 INV-STOCK-IN — Stock In Form (BC-UC-15)

**Purpose**: Register one or more newly collected blood bags into inventory.

**UI Elements**:
- Page title: "Stock In — Register New Blood Bags"
- **Blood bag entry form** (repeatable — can add multiple):
  - Blood Type (dropdown, required)
  - Volume in ml (number input, required, > 0)
  - Collection Date (date picker, required)
  - Expiry Date (date picker, required, must be > collection date)
  - Storage Location (text input or dropdown, required)
- **"+ Add Another Blood Bag" button** → adds another entry row
- **"Remove" button** per entry (if multiple entries)
- **"Stock In" button** (red, primary) → submits all entries
- **"Cancel" button** → discard confirmation dialog (AF-03)

**Auto-generated**:
- Blood Bag ID (`bagCode`) — generated by server
- Initial Status — set to "Available" automatically by server

**Validation (AF-01, AF-02)**:
- All fields required per entry
- Volume > 0
- Expiry Date > Collection Date
- On validation error → highlight affected fields with red border + error message
- Partial save MUST NOT occur — all-or-nothing transaction

**API Endpoint**: `POST /api/v1/bc/inventory/stock-in` (body: array of blood bag entries)

---

### 2.5 INV-STOCK-OUT — Stock Out (BC-UC-16)

**Purpose**: Select and remove blood bags from inventory with a reason.

**UI Elements**:
- Page title: "Stock Out"
- **Searchable/filterable blood bag list** (only bags eligible for stock-out, e.g., "Available")
  - Same search/filter as inventory (BC-UC-13)
  - Checkboxes for multi-select
- **Selected bags summary** (bottom panel or sidebar):
  - Count of selected bags
  - List of selected bag IDs + blood types
- **Stock-Out Reason** (dropdown: Dispatch, Disposal, Transfer, Other)
- **Additional Notes** (text area, optional)
- **"Confirm Stock Out" button** (red) → submit
- **"Cancel" button** → discard (AF-02)

**Validation (AF-01)**:
- At least one bag must be selected
- Stock-out reason is required

**API Endpoint**: `POST /api/v1/bc/inventory/stock-out`

#### 2.5.1 🔄 FEFO (First Expired, First Out) UX Specification

> **Requirement Source**: `BC-UC-16` Special Requirements — "The FEFO suggestion list should be clearly presented to minimize manual selection effort"
> **Status**: ✅ Fully specified below (supplements Figma which does not explicitly show FEFO)

**FEFO Sorting Logic**:
- Default sort order: `expiryDate ASC` (earliest expiry date first = FEFO)
- Sort indicator label at top of list: "📋 Sorted by: First Expired, First Out (FEFO)"
- User can override sort order but FEFO is always the default

**FEFO Visual Indicators on Blood Bag Rows**:

| Expiry Status | Condition | Visual Treatment |
| :--- | :--- | :--- |
| 🔴 **Expired** | `expiryDate < today` | `bg-red-100 text-red-900` row, "EXPIRED" red badge, **not selectable** (disabled checkbox) |
| 🟠 **Critical** (≤ 3 days) | `expiryDate - today ≤ 3` | `bg-orange-50 border-l-4 border-l-orange-500` row, "⚠ Expires in X days" amber tag |
| 🟡 **Near-Expiry** (≤ 7 days) | `expiryDate - today ≤ 7` | `bg-amber-50/50` row, "Expires in X days" text in expiry column |
| 🟢 **Normal** | `expiryDate - today > 7` | Standard `bg-white` row |

**FEFO Recommendation Panel** (top of stock-out list):

```
┌──────────────────────────────────────────────────────────────┐
│  📋 FEFO Recommendation                                      │
│  ────────────────────────────────────────────────────────────│
│  ⚠ 3 blood bags are near expiry (≤ 7 days).                 │
│  Consider selecting these first to minimize waste.           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  ☐ BB-2026-0451  │ O+  │ 350ml │ Exp: Jul 23 (2d) │     │
│  │  ☐ BB-2026-0389  │ A-  │ 450ml │ Exp: Jul 24 (3d) │     │
│  │  ☐ BB-2026-0412  │ B+  │ 350ml │ Exp: Jul 26 (5d) │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  [Select All Recommended]              [Skip — Show All]     │
└──────────────────────────────────────────────────────────────┘
```

**Tailwind classes for FEFO panel**:
```
container:        bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4
header:           text-amber-900 font-semibold text-sm flex items-center gap-2
                  (📋 ClipboardList icon)
description:      text-amber-700 text-sm
recommendation:   bg-white rounded-md border border-amber-200 p-2 mt-2
select-all-btn:   bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700
skip-btn:         text-amber-700 underline hover:text-amber-900
near-expiry-row:  bg-orange-50 border-l-2 border-l-orange-400
```

**"Select All Recommended" button behavior**:
- Automatically checks all near-expiry bags (≤ 7 days)
- Updates selected count in summary panel
- Scroll to reason form section

**"Skip — Show All" link behavior**:
- Collapses the FEFO panel
- Shows the full inventory list with FEFO sort still applied as default

---

### 2.6 INV-STATS — Inventory Statistics Dashboard (BC-UC-17)

**Purpose**: Visual dashboard with charts and summary tables for inventory analytics.

**UI Elements**:
- Page title: "Blood Inventory Statistics"
- **Summary Stat Cards** (top row):
  - Total Blood Units
  - Available Blood Units
  - Near-Expiry Blood Units (⚠ warning color if > 0)
  - Low-Stock Blood Types (⚠ warning if any)
- **Charts Section**:
  - **Bar Chart**: Number of blood units by blood type (A+, A−, B+, B−, AB+, AB−, O+, O−)
  - **Doughnut/Pie Chart**: Blood type distribution (percentage)
  - **Chart Mode Toggle**: Units / Volume / Near-Expiry (AF-03)
- **Summary Table**:
  - Rows: one per blood type
  - Columns: Blood Type, Total Units, Total Volume (ml), Near-Expiry Units, Stock Status (Normal/Low/Critical)
  - Low-stock rows highlighted with amber/red background
- **Warning Indicators**:
  - Low-stock blood types: Amber warning icon + text (AF-01)
  - Near-expiry blood units: Red warning with count (AF-02)

**Chart Library**: Recommend `recharts` or `chart.js` with `react-chartjs-2`

**API Endpoint**: `GET /api/v1/bc/inventory/statistics`

---

## 3. Responsive Design (NFR-U-01)

> **Note**: Figma only provides desktop layout. The following responsive specs are **spec-defined** to satisfy `NFR-U-01`.

### 3.1 Inventory List Page (BC-UC-12)

| Breakpoint | Layout Changes |
| :--- | :--- |
| **Desktop** (≥1280px) | Sidebar visible, full table with all columns, summary cards in 4-column row |
| **Tablet** (768–1279px) | Sidebar collapsed, table shows 5 priority columns (ID, Type, Volume, Expiry, Status), summary cards in 2×2 grid |
| **Mobile** (≤767px) | No sidebar (hamburger), table → **card list** view (each blood bag as a card), summary cards stacked vertically |

**Mobile Card View for Blood Bags**:
```
┌─────────────────────────────┐
│  BB-2026-0451          O+   │
│  ───────────────────────── │
│  Volume:  350 ml            │
│  Expiry:  Jul 23, 2026      │
│  Status:  🟢 Available      │
│  Location: Shelf A-2        │
│                    [View →] │
└─────────────────────────────┘
```

### 3.2 Blood Bag Detail (BC-UC-14)

| Breakpoint | Layout Changes |
| :--- | :--- |
| **Desktop** | Two-column: Info Card (left) + Status History (right) |
| **Tablet** | Single column, Info Card on top, Status History below |
| **Mobile** | Single column, compact card, timeline simplified |

### 3.3 Stock In Form (BC-UC-15)

| Breakpoint | Layout Changes |
| :--- | :--- |
| **Desktop** | Each entry as a horizontal row (5 fields in one line) |
| **Tablet** | Each entry as 2-row grid (3+2 field layout) |
| **Mobile** | Each entry as vertical stack (all fields stacked, full width) |

### 3.4 Stock Out Page (BC-UC-16)

| Breakpoint | Layout Changes |
| :--- | :--- |
| **Desktop** | Two-column: Selection list (left 60%) + Summary/Reason panel (right 40%) |
| **Tablet** | Single column: Selection list on top, Summary panel below (sticky bottom) |
| **Mobile** | Single column: Selection list as cards, Floating "X selected" bottom bar with "Continue" button |

### 3.5 Statistics Dashboard (BC-UC-17)

| Breakpoint | Layout Changes |
| :--- | :--- |
| **Desktop** | Stat cards (4 columns), Charts side-by-side (Bar 60% + Doughnut 40%), Table full width |
| **Tablet** | Stat cards (2×2), Charts stacked (full width each), Table full width with horizontal scroll |
| **Mobile** | Stat cards stacked (1 column), Charts stacked (full width), Table replaced with card list per blood type |

---

## 4. Figma vs. UseCaseSpec Alignment Review

| Figma Screen | Matches UC? | Notes |
| :--- | :--- | :--- |
| Inventory table with summary cards | ✅ BC-UC-12 | Table + Stock In/Out buttons visible |
| Search/filter in inventory | ✅ BC-UC-13 | Search bar + filter dropdowns present |
| Blood bag detail page | ✅ BC-UC-14 | Status history + edit status visible |
| Stock In form with multiple entries | ✅ BC-UC-15 | Multi-row form with "Add" button visible |
| Stock Out with selection list | ✅ BC-UC-16 | Checkbox selection + reason field visible |
| Stock Out FEFO | ✅ Fully specified | **Spec defines FEFO panel, sorting, visual indicators** — not explicit in Figma |
| Statistics dashboard with charts | ✅ BC-UC-17 | Bar chart + pie chart + summary table visible |
| Responsive layouts | ✅ Fully specified | **Spec defines mobile/tablet for all pages** — not in Figma |

> **✅ RESOLVED (was ⚠ FEFO)**: Section 2.5.1 now fully specifies the FEFO UX including default sorting, visual expiry indicators, recommendation panel with "Select All" quick-action, and responsive behavior. Frontend devs can implement without additional Figma design.

> **ℹ Design Note**: The inventory table appears to use a **dark blue/navy header** in Figma instead of the standard red header used in Campaign Management. This spec assumes it is **intentional** to visually distinguish the Inventory module. If the design team disagrees, update the table header to match the LifeLine red theme.
