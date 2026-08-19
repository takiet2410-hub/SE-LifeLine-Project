# Feature Specification: Blood Inventory Management (BC-UC-12 → BC-UC-17)

> **Spec-Kit Feature**: `specs/BC-UC-12-17-blood-inventory`
> **Module Path**: `src/frontend/src/modules/blood-inventory/`
> **Figma Reference**: "Blood Center" → Inventory Dashboard, Blood Bag Detail, Stock In, Stock Out, Statistics (`reference.png`)
> **Governance Constraints**: Additive-only, non-destructive, preserve existing API contracts.

---

## Executive Summary

The Blood Inventory Management feature equips Blood Center Staff, Medical Supervisors, and Chief Hematologists with comprehensive capabilities to monitor, receive, inspect, dispatch, and analyze blood inventory. 
It revolves around a central Inventory Dashboard, from which all other operations (Search, Status Edit, Stock In, Stock Out, Statistics) branch out.

### Complete Blood Inventory & Emergency Coordination Workflow

```text
                    ┌──────────────────────┐
                    │ Blood Center Staff   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ BC-UC-12             │
                    │ View Blood Inventory │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
 ┌────────────────┐   ┌─────────────────┐  ┌──────────────────┐
 │ BC-UC-13       │   │ BC-UC-14        │  │ BC-UC-17         │
 │ Search Bag     │   │ Edit Bag Status │  │ View Statistics  │
 └───────┬────────┘   └────────┬────────┘  └────────┬─────────┘
         │                     │                    │
         │                     │                    ├── Low Stock
         │                     │                    └── Near Expiry
         │                     │
         └──────────┬──────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
 ┌────────────────┐   ┌────────────────┐
 │ BC-UC-15       │   │ BC-UC-16       │
 │ Stock In       │   │ Stock Out      │
 └───────┬────────┘   └───────┬────────┘
         │                    │
         ▼                    ▼
 Generate Bag ID        Validate Bags
 Status = Available     Select Reason
         │                    │
         │                    ▼
         │              Update Status
         │                    │
         └──────────┬─────────┘
                    ▼
          ┌────────────────────┐
          │ Current Inventory  │
          │ Updated            │
          └─────────┬──────────┘
                    │
                    │ Inventory data
                    │
                    ▼
          ┌─────────────────────┐
          │ SYS-UC-04           │
          │ Evaluate &          │
          │ Prioritize SOS      │
          └──────────┬──────────┘
                     │
             ┌───────┴────────┐
             ▼                ▼
       Blood Centers        Donors
       ranked by           matched by
       inventory +         distance +
       compatibility       eligibility
             │                │
             └───────┬────────┘
                     ▼
             ┌────────────────┐
             │ SYS-UC-05      │
             │ Broadcast SOS  │
             └────────────────┘
```

---

## 1. Use Case Specifications

### BC-UC-12: View Blood Inventory

* **Goal**: Provide authorized staff with a real-time overview of current blood inventory. This is the entry point of Inventory Management, from which staff can branch out to other use cases.
* **Primary Actor**: Blood Center Staff / Medical Supervisor
* **Preconditions**:
  1. Staff is logged in to the system.
  2. Staff has permission to access inventory management.
  3. Inventory management service is operational.
* **Main Success Flow**:
```text
Staff
  │
  │ Click Inventory
  ▼
System
  │
  │ Query latest inventory
  ▼
MongoDB
  │
  │ Blood Bag records
  ▼
System
  │
  ├── Blood Bag ID
  ├── Blood Type
  ├── Volume
  ├── Collection Date
  ├── Expiry Date
  ├── Status
  └── Storage Location
  │
  ▼
Inventory Page
```
  1. System fetches latest inventory data from the database.
  2. System renders the summary (total blood bags, available blood bags).
  3. System renders the Blood Bag list with key information: Blood Bag ID, Blood Type, Volume, Collection Date, Expiry Date, Status, Storage Location.
  4. From the Inventory Page, staff can branch out to:
     - Search (BC-UC-13)
     - Select Bag to view/edit (BC-UC-14)
     - Stock In (BC-UC-15)
     - Stock Out (BC-UC-16)
     - Statistics (BC-UC-17)

---

### BC-UC-13: Search Blood Bag

* **Goal**: Act as an extension point of BC-UC-12 and BC-UC-16, allowing staff to quickly find specific blood bags using various criteria.
* **Primary Actor**: Blood Center Staff
* **Main Success Flow**:
```text
Inventory / Stock Out
   │
   ▼
Click Search / Filter
   │
   ▼
Enter keyword OR Select filters
   │
   ▼
Click Search
   │
   ▼
System queries database
   │
   ▼
Filter matching blood bags
   │
   ▼
Display result table
   │
   ├── Bag ID
   ├── Blood Type
   ├── Volume
   ├── Intake Date
   ├── Expiry Date
   └── Status
   │
   ▼
Staff selects bag
   │
   ▼
BC-UC-14 View/Edit Blood Bag Status OR BC-UC-16 Select for Stock Out
```
* **Alternate & Error Flows**:
  * *No matching records*: If no records found, display "No matching blood bags found." Staff can adjust criteria and search again.
* **Acceptance Criteria**:
  * Search results must be returned within 2 seconds.
  * Search results must reflect the correct current inventory state.
  * Can be used to narrow down the list before selecting blood bags in Stock Out (BC-UC-16).
  * Staff can search by: Blood Bag ID, Blood type, Intake/collection date, Expiry date, Status, Donation source / related campaign.

---

### BC-UC-14: View/Edit Blood Bag Status

* **Goal**: Display details for a selected blood bag and allow authorized staff to update its status based on valid transitions.
* **Primary Actor**: Blood Center Staff
* **Main Success Flow**:
```text
Select Blood Bag
       │
       ▼
Display Blood Bag Details
       │
       ├── Bag ID
       ├── Blood Type
       ├── Volume
       ├── Collection Date
       ├── Expiry Date
       ├── Donor Source
       ├── Test Results
       ├── Current Status
       └── Status Change History
       │
       ▼
Click "Edit Status"
       │
       ▼
System displays valid statuses based on current status
       │
       ▼
Staff selects new status
       │
       ▼
Click Save
       │
       ▼
System validates transition
       │
       ├── Invalid ──► Error
       │
       ▼ Valid
Update Blood Bag Status
       │
       ▼
Record Audit Log
       │
       ▼
Success
```
* **Acceptance Criteria**:
  * System only displays valid target statuses based on the current status.
  * Status history is displayed in chronological order.
  * Examples of lifecycles: Stock In -> Available -> Reserved -> Used. OR Available -> Expired -> Discarded.

---

### BC-UC-15: Stock In

* **Goal**: Put new blood bags into the available inventory. Staff inputs information and system automatically generates IDs.
* **Primary Actor**: Blood Center Staff
* **Main Success Flow**:
```text
Inventory Page
      │
      ▼
Click "Stock In"
      │
      ▼
Display Stock-In Form
      │
      ▼
Staff enters: Blood Type, Volume, Collection Date, Expiry Date, Storage Location
      │
      ▼
Add another bag? ── YES ──► Add entry
      │
      NO
      ▼
Click Stock In
      │
      ▼
Validate ALL entries
      │
      ├──── Invalid ────► Show validation errors
      │                       │
      │                       ▼
      │                  Staff corrects
      │                       │
      │                       └──► Validate again
      │
      ▼ Valid
Generate unique Blood Bag ID
      │
      ▼
Set Status = Available
      │
      ▼
Create Blood Bag records
      │
      ▼
Add to Inventory
      │
      ▼
Success message
      │
      ▼
Return Inventory page
```
* **Validation & Bulk Entry**:
  * **Missing required information**: System highlights field -> Shows message -> Staff fixes -> Submit again.
  * **Invalid information**: e.g., Negative volume, Expiry date earlier than collection date. Shows error per entry -> Staff fixes -> Submit again.
  * **Bulk Stock In**: One or more bags can be entered in the same operation. All are validated and created at once.

---

### BC-UC-16: Stock Out

* **Goal**: Remove blood bags from available inventory for dispatch, disposal, or transfer.
* **Primary Actor**: Blood Center Staff
* **Main Success Flow**:
```text
Inventory
   │
   ▼
Click "Stock Out"
   │
   ▼
System displays eligible blood bags (provides FEFO suggestion)
   │
   ├───────────────┐
   │               │
   ▼               ▼
View list       Search (narrow down list)
                   │
                   ▼
             Filter bags
                   │
                   └──────┐
                          ▼
                   Select blood bag(s)
                          │
                          ▼
                   Enter Stock-Out Reason
                          │
                   ┌──────┴──────┐
                   │             │
               Dispatch      Disposal (or Transfer)
                   │             │
                   └──────┬──────┘
                          │
                          ▼
                  Confirm Stock Out
                          │
                          ▼
                    Validate data
                          │
                 ┌────────┴────────┐
                 │                 │
              Invalid             Valid
                 │                 │
                 ▼                 ▼
             Show error      Update status
                 │                 │
                 └──► Fix       Remove from available inventory
                                   │
                                   ▼
                              Audit Log
                                   │
                                   ▼
                              Success
                                   │
                                   ▼
                            Inventory updated
```
* **FEFO in Stock Out**: FEFO suggestion list is displayed clearly to help staff reduce manual selection. The system *suggests* bags but staff manually selects them before confirmation.

---

### BC-UC-17: View Blood Inventory Statistics

* **Goal**: Provide insights and visual charts of the inventory state, with alerts for low stock and near expiry.
* **Primary Actor**: Chief Hematologist / Medical Supervisor
* **Main Success Flow**:
```text
Inventory Page
      │
      ▼
Click Statistics
      │
      ▼
System retrieves latest inventory statistics
      │
      ▼
Statistics Dashboard
      │
      ├── Total Blood Units
      ├── Available Blood Units
      ├── Near-Expiry Units
      └── Low-Stock Blood Types
      │
      ▼
Charts
      │
      ├── Number by Blood Type
      ├── Blood Type Distribution
      └── Total Volume by Blood Type
      │
      ▼
Summary Table
      │
      ├── Total Units
      ├── Total Volume
      ├── Near-Expiry Units
      └── Current Stock Status
      │
      ▼
Warning?
 ┌────┴─────┐
 │          │
YES         NO
 │          │
 ▼          ▼
Low Stock /  Review
Near Expiry  Statistics
 │
 ▼
Review
```
* **Acceptance Criteria**:
  * **Low-stock warning**: If calculated inventory for a blood type < configured safety threshold, highlight blood type, staff reviews warning.
  * **Near-expiry warning**: If bag is approaching expiry date, display warning and show number of affected bags.
  * Staff can switch chart modes between Units, Volume, and Near Expiry. System updates chart but keeps summary info.

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
| **Bag Detail** (UC-14) | 2-column (Info + Timeline) | 1-column Stacked | 1-column Compact |
| **Stock In** (UC-15) | Horizontal Row Grid | 2-row Grid per Entry | Vertical Stacked Inputs |
| **Stock Out** (UC-16) | 60/40 Split View | Stacked View | Card List + Floating Action Bar |
| **Statistics** (UC-17) | Side-by-side Charts | Stacked Charts | 1-column Cards + Stacked Charts |

---

## 4. Constraint Checklist

- ✅ **Additive-Only**: No existing files or schemas deleted or broken.
- ✅ **No Breaking Changes**: Extends existing router and module structures seamlessly.
- ✅ **Specification Quality**: Technology-agnostic business requirements with concrete acceptance criteria.
