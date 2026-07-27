# Feature Specification: Blood Inventory Management (BC-UC-12 → BC-UC-17)

> **Spec-Kit Feature**: `specs/BC-UC-12-17-blood-inventory`
> **Module Path**: `src/frontend/src/modules/blood-inventory/`
> **Figma Reference**: "Blood Center" → Inventory Dashboard, Blood Bag Detail, Stock In, Stock Out, Statistics (`reference.png`)
> **Governance Constraints**: Additive-only, non-destructive, preserve existing API contracts.

---

## Executive Summary

The Blood Inventory Management feature equips Blood Center Staff, Medical Supervisors, and Chief Hematologists with comprehensive capabilities to monitor, receive, inspect, dispatch, and analyze blood inventory.

---

## 1. Use Case Specifications

### BC-UC-12: View Blood Inventory Dashboard

* **Goal**: Provide authorized staff with a real-time overview of current blood inventory counts, health metrics, and a searchable/paginated list of blood bags.
* **Primary Actor**: Blood Carrier Staff / Medical Supervisor
* **Preconditions**:
  1. Staff is authenticated with an authorized role (`BloodCenterStaff`, `MedicalSupervisor`, or `Administrator`).
  2. Backend inventory API endpoint (`GET /api/v1/bc/inventory`) is accessible.
* **Main Success Flow**:
  1. Staff navigates to `/bc/inventory`.
  2. System fetches summary metrics and paginated blood bag records.
  3. System renders **Summary Cards**:
     - Total Blood Bags (count)
     - Available Bags (count)
     - Total Volume (ml)
     - Near-Expiry Count (within 7 days, "Warning" badge)
     - Low Stock Types Count ("Critical" badge)
  4. System renders the **Blood Inventory Table** with columns:
     - Bag ID (`bagCode`)
     - Blood Type badge (`A+`, `O-`, etc.)
     - Volume (ml)
     - Collection Date
     - Expiry Date (with "Days Remaining" progress bar)
     - Status badge (`Available`, `Near Expiry`, `Reserved`, `Expired`, `Discarded`)
     - Storage Location
     - Actions ("View Detail")
  5. Top actions bar provides entry points to **Stock In** (`/bc/inventory/stock-in`), **Stock Out** (`/bc/inventory/stock-out`), and **Statistics** (`/bc/inventory/stats`).
* **Alternate & Error Flows**:
  * *AF-01 (Server Error)*: API returns 500/503 -> Show error banner with "Retry" button.
  * *AF-02 (Empty Inventory)*: API returns 0 records -> Show empty state illustration: "No blood bags currently in inventory".
* **Acceptance Criteria**:
  * Summary cards accurately aggregate inventory stats.
  * Days remaining progress bar turns amber when ≤ 7 days, red when 0 days.
  * Pagination controls work smoothly (10 items per page by default).
* **UI Mockup Reference**: Figma `INV-LIST` (Inventory Dashboard).

---

### BC-UC-13: View / Update Blood Bag Status

* **Goal**: Display full information (medical screening, storage, donor reference) for a specific blood bag and allow authorized staff to update its status.
* **Primary Actor**: Blood Carrier Staff
* **Preconditions**:
  1. Blood bag exists in the database with a valid ID (`bagId`).
* **Main Success Flow**:
  1. Staff clicks a blood bag row on the dashboard or navigates to `/bc/inventory/:bagId`.
  2. System loads blood bag details:
     - **Header Info**: Bag ID, Blood Type, Status badge, Volume (ml), Collection & Expiry dates, Days remaining.
     - **Medical Screening Results**: HIV-1/2, HBV, HCV, Syphilis with verification date and result badges (`Negative` / `Positive`).
     - **Storage & Logistics**: Location name, Shelf/Position, Temperature (°C), Stability status (`Stable` / `Alert`).
     - **Donor Reference**: Donor Name, Donor ID, link to donor profile.
  3. Staff clicks **"Edit Status"** button.
  4. System opens status update dialog with target status dropdown (`Available`, `Reserved`, `Expired`, `Discarded`) and mandatory reason field.
  5. Staff selects new status, enters reason, and clicks "Save Changes".
  6. System updates status via `PUT /api/v1/bc/inventory/:bagId/status`, appends entry to `statusHistory` timeline, and updates UI.
* **Alternate & Error Flows**:
  * *AF-01 (Expired Bag)*: Current status is `Expired` -> "Edit Status" button is disabled; status cannot be set back to `Available`.
  * *AF-02 (Invalid Transition)*: Staff attempts invalid transition (e.g. `Discarded` -> `Available`) -> System shows inline error: "Invalid status transition".
* **Acceptance Criteria**:
  * All 4 screening test results are displayed with verification timestamp.
  * Status changes are recorded in `statusHistory` with staff name, timestamp, and reason.
* **UI Mockup Reference**: Figma `INV-BAG-DETAIL` & `INV-BAG-EDIT-STATUS`.

---

### BC-UC-14: Stock In (Receive Blood Bags)

* **Goal**: Register newly collected or transferred blood bags into active inventory in batch.
* **Primary Actor**: Blood Carrier Staff
* **Preconditions**:
  1. Staff navigates to `/bc/inventory/stock-in`.
* **Main Success Flow**:
  1. System displays Stock In multi-row form grid.
  2. Staff adds one or more rows. Each row requires:
     - Blood Type (dropdown: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`)
     - Volume (ml, positive integer)
     - Collection Date (date picker)
     - Expiry Date (date picker, auto-suggested 35/42 days based on component)
     - Location (dropdown: `Central Storage`, `Mobile Unit A`, `Donor Center`)
  3. Staff clicks **"+ Add Row"** to append additional bags or trash icon to remove rows.
  4. Staff clicks **"Confirm & Save"**.
  5. System validates all fields (Volume > 0, Expiry Date > Collection Date).
  6. System submits payload via `POST /api/v1/bc/inventory/stock-in`, auto-generates `bagCode` for each, sets initial status to `Available`, and redirects to inventory dashboard with success toast.
* **Alternate & Error Flows**:
  * *AF-01 (Validation Failure)*: Invalid dates or volume ≤ 0 -> Highlight affected input cells in red; display error message; prevent submission.
  * *AF-02 (Cancel Entry)*: Staff clicks "Cancel" with unsubmitted data -> Display confirmation modal: "Discard unsaved entries?".
* **Acceptance Criteria**:
  * Supports single or multi-row batch entry.
  * Validation executes atomically (all rows must pass before saving).
* **UI Mockup Reference**: Figma `INV-STOCK-IN` & `INV-STOCK-IN-CONFIRM`.

---

### BC-UC-15: Stock Out (Dispatch / Discard Blood Bags)

* **Goal**: Select and dispatch or discard blood bags from inventory utilizing First Expired, First Out (FEFO) guidance.
* **Primary Actor**: Blood Carrier Staff / Medical Supervisor
* **Preconditions**:
  1. Staff opens `/bc/inventory/stock-out`.
* **Main Success Flow**:
  1. System loads available blood bags sorted by expiry date ascending (`FEFO`).
  2. System renders **FEFO Recommendation Panel** at top highlighting bags expiring within 7 days.
  3. Staff can click **"Select All Recommended"** or manually select bags via table checkboxes.
  4. Selected count and total volume update in summary panel.
  5. Staff selects **Stock Out Reason** (dropdown: `Hospital Dispatch`, `Emergency Transport`, `Expired Disposal`, `Quality Quarantine`) and optional notes.
  6. Staff clicks **"Confirm Stock Out"**.
  7. System submits request via `POST /api/v1/bc/inventory/stock-out`, updates status of selected bags, logs transaction, and shows completion toast.
* **Alternate & Error Flows**:
  * *AF-01 (No Selection)*: Staff clicks confirm without selecting any bags -> Show warning message: "Please select at least one blood bag".
  * *AF-02 (Quarantined Bag Selected)*: Selected bag has `Quarantined` status -> Block dispatch for that bag unless reason is `Quality Quarantine`.
* **Acceptance Criteria**:
  * FEFO recommendation panel displays bags near expiry (≤ 7 days).
  * Multi-select checkboxes accurately maintain selected bag IDs.
  * Stock Out Reason is mandatory.
* **UI Mockup Reference**: Figma `INV-STOCK-OUT` & `INV-STOCK-OUT-CONFIRM`.

---

### BC-UC-16: View Blood Inventory Statistics

* **Goal**: Provide analytical dashboards, blood group comparison charts, and threshold indicators for strategic decision-making.
* **Primary Actor**: Chief Hematologist / Medical Supervisor
* **Preconditions**:
  1. Staff navigates to `/bc/inventory/stats`.
* **Main Success Flow**:
  1. System fetches analytics data via `GET /api/v1/bc/inventory/statistics`.
  2. System renders **Summary Metrics Cards**:
     - Total Units (with % change vs last month)
     - Available Units
     - Near Expiry Units (urgent warning indicator)
     - Low Stock Types Count (critical warning indicator)
  3. System renders **Inventory Analytics Bar Chart** comparing blood groups, with view toggle (`Units` / `Volume` / `Expiry`).
  4. System renders **Type Distribution Donut Chart** (Rh+ vs Rh- percentage with unit breakdown).
  5. System renders **Detailed Inventory Status Table** per blood type: Total Units, Near Expiry, Minimum Threshold, Stock Status (`Critical` / `Low Stock` / `Sufficient`).
* **Alternate & Error Flows**:
  * *AF-01 (No Data)*: Analytics database is empty -> Render chart shell with message "No inventory statistics available".
* **Acceptance Criteria**:
  * Toggle buttons seamlessly switch chart metrics between Units, Volume, and Expiry.
  * Status badges dynamically reflect stock levels vs predefined thresholds.
* **UI Mockup Reference**: Figma `INV-STATS`.

---

### BC-UC-17: Filter & Search Inventory Records

* **Goal**: Provide unified, reusable search and multi-criteria filtering across inventory lists and selection pages.
* **Primary Actor**: Blood Carrier Staff / Medical Supervisor / Chief Hematologist
* **Preconditions**:
  1. Staff is on Inventory Dashboard (`/bc/inventory`) or Stock Out page (`/bc/inventory/stock-out`).
* **Main Success Flow**:
  1. Staff enters Bag ID keyword in search input or selects filter criteria:
     - Blood Type (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`)
     - Status (`Available`, `Near Expiry`, `Reserved`, `Expired`, `Discarded`)
     - Date Range (Collection Date / Expiry Date)
  2. System filters records dynamically or on "Search" click.
  3. System updates table rows and pagination count.
  4. Staff clicks **"Clear"** button -> System resets all filters and reloads full inventory list.
* **Alternate & Error Flows**:
  * *AF-01 (No Matches)*: No bags match query -> Display empty state: "No matching blood bags found".
* **Acceptance Criteria**:
  * Search performs case-insensitive partial match on `bagCode`.
  * Filters combine using AND logic.
  * Clear button resets search input and dropdowns in 1 click.
* **UI Mockup Reference**: Figma `INV-SEARCH`.

---

## 2. Technical Data Schemas & Contracts

### 2.1 Blood Bag Entity (`BLOOD_BAG`)

```typescript
export interface BloodBag {
  _id: string;
  bagCode: string; // e.g. "BB-2026-0451"
  bloodCenterId: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  volumeMl: number;
  collectionDate: string; // ISO 8601
  expiryDate: string; // ISO 8601
  storageLocation: string; // e.g. "Shelf A-2"
  status: 'Available' | 'Reserved' | 'Used' | 'Expired' | 'Discarded';
  donorSourceId?: string;
  campaignSourceId?: string;
  testResults: {
    hiv: 'Negative' | 'Positive';
    hbv: 'Negative' | 'Positive';
    hcv: 'Negative' | 'Positive';
    syphilis: 'Negative' | 'Positive';
    verifiedAt: string;
  };
  statusHistory: Array<{
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: string; // ISO 8601
    reason?: string;
  }>;
}
```

---

## 3. Responsive Layout Specifications

| Screen | Desktop (≥1280px) | Tablet (768px-1279px) | Mobile (≤767px) |
| :--- | :--- | :--- | :--- |
| **Inventory List** (UC-12) | 4 Stat Cards, 8-column Table | 2x2 Stat Cards, 5-column Table | Stacked Cards, Card List View |
| **Bag Detail** (UC-13) | 2-column (Info + Timeline) | 1-column Stacked | 1-column Compact |
| **Stock In** (UC-14) | Horizontal Row Grid | 2-row Grid per Entry | Vertical Stacked Inputs |
| **Stock Out** (UC-15) | 60/40 Split View | Stacked View | Card List + Floating Action Bar |
| **Statistics** (UC-16) | Side-by-side Charts | Stacked Charts | 1-column Cards + Stacked Charts |

---

## 4. Constraint Checklist

- ✅ **Additive-Only**: No existing files or schemas deleted or broken.
- ✅ **No Breaking Changes**: Extends existing router and module structures seamlessly.
- ✅ **Specification Quality**: Technology-agnostic business requirements with concrete acceptance criteria.
