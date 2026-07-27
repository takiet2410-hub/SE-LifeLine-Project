# Quickstart & End-to-End Validation Guide

## Prerequisites & Running Servers

1. **Backend**:
   ```bash
   cd src/backend-core
   npm run dev
   ```
2. **Frontend**:
   ```bash
   cd src/frontend
   npm run dev
   ```

---

## Validation Scenarios

### Scenario 1: Stock In Blood Bags (BC-UC-14)
1. Navigate to `http://localhost:5173/bc/inventory/stock-in`.
2. Enter Blood Type: `O+`, Volume: `350`, Collection Date: Today, Expiry Date: +35 days, Location: `Shelf A-1`.
3. Click "+ Add Row" and enter a second row for `A-`.
4. Click "Confirm & Save".
5. **Expected Outcome**: Redirects to `/bc/inventory` dashboard with success toast, new blood bags appear in table.

### Scenario 2: Search & Filter Inventory (BC-UC-17, BC-UC-12)
1. Navigate to `http://localhost:5173/bc/inventory`.
2. Type `BB-` or a specific blood type in search/filter dropdown.
3. Select Status `Available`.
4. **Expected Outcome**: Table filters instantly to matching blood bags. Click "Clear" to reset.

### Scenario 3: View & Edit Blood Bag Status (BC-UC-13)
1. Click on any blood bag row on `/bc/inventory`.
2. Inspect detail card, medical screening results, and storage information.
3. Click "Edit Status" -> Select `Reserved` -> Type reason "Emergency surgery".
4. Click "Save Changes".
5. **Expected Outcome**: Status updates to `Reserved`, change is logged in `statusHistory` timeline.

### Scenario 4: Stock Out with FEFO (BC-UC-15)
1. Navigate to `http://localhost:5173/bc/inventory/stock-out`.
2. Inspect FEFO recommendation panel (bags near expiry displayed at top).
3. Click "Select All Recommended" or check 1-2 bags.
4. Select Reason: `Hospital Dispatch`.
5. Click "Confirm Stock Out".
6. **Expected Outcome**: Selected bags are updated to `Used` or `Dispatched` status and removed from available stock.

### Scenario 5: View Inventory Statistics (BC-UC-16)
1. Navigate to `http://localhost:5173/bc/inventory/stats`.
2. Verify bar chart, donut chart, summary stat cards, and detailed threshold table.
3. **Expected Outcome**: Charts render dynamically based on active inventory data.
