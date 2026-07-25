# Spec: BC-UC-01 → BC-UC-07 — Campaign Management (Frontend)

> **Spec-Kit Artifact** | **Covers**: BC-UC-01, BC-UC-02, BC-UC-03, BC-UC-04, BC-UC-05, BC-UC-06, BC-UC-07
> **Actor**: Blood Center Staff
> **Module**: `src/frontend/src/modules/campaign-mgmt/`
> **Figma Section**: "Blood Center" → Campaign Management screens (rows 1–4 of reference.png)

---

## 1. Figma Reference & Design Token Mapping

- **Figma File**: `https://www.figma.com/design/BkMtRpqqIa0J680q1DukPt/Untitled?node-id=1-29566`
- **Reference Image**: `docs/analysis-and-design/ui-design/bc-frontend-assets/reference.png`

### 1.1 Design Tokens (extracted from reference.png)

| Token | Value | Tailwind Equivalent |
| :--- | :--- | :--- |
| Primary Red | `#DC2626` / `#E53935` | `bg-red-600`, `text-red-600`, `border-red-600` |
| Dark Sidebar | `#1E293B` / `#1F2937` | `bg-slate-800` / `bg-gray-800` |
| Surface White | `#FFFFFF` | `bg-white` |
| Surface Gray | `#F8FAFC` / `#F1F5F9` | `bg-slate-50` / `bg-slate-100` |
| Text Primary | `#0F172A` | `text-slate-900` |
| Text Secondary | `#64748B` | `text-slate-500` |
| Border | `#E2E8F0` | `border-slate-200` |
| Success Green | `#22C55E` | `text-green-500` |
| Warning Amber | `#F59E0B` | `text-amber-500` |
| Error Red | `#EF4444` | `text-red-500` |
| Font Family | Inter / system-ui | `font-sans` (configure Tailwind to use Inter) |
| Border Radius | 8px (cards), 6px (inputs) | `rounded-lg`, `rounded-md` |
| Shadow | subtle card shadow | `shadow-sm` |

### 1.2 Screens Identified from Figma

| Screen ID | Name | Figma Position | Maps to UC |
| :--- | :--- | :--- | :--- |
| CAM-LIST | Campaign List (table view) | Row 1, Col 1-2 | BC-UC-02 |
| CAM-CREATE | Create Campaign (form) | Row 1, Col 2 (modal/page) | BC-UC-01 |
| CAM-DETAIL-VIEW | Campaign Detail (read-only) | Row 1, Col 3-4 | BC-UC-03 (view) |
| CAM-DETAIL-EDIT | Campaign Detail (edit mode) | Row 1, Col 3-4 variant | BC-UC-03 (edit) |
| CAM-CONFIRM-DIALOG | Confirmation Dialog (discard/cancel) | Row 1, Col 5 | BC-UC-01/03 AF-02/AF-03 |
| REG-LIST | Donor Registration List (table) | Row 2, Col 1-2 | BC-UC-04 |
| REG-LIST-SEARCH | Registration List w/ search | Row 2, Col 1-2 variant | BC-UC-06 |
| REG-DETAIL-VIEW | Registration Detail (read-only) | Row 3, Col 1-2 | BC-UC-05 (view) |
| REG-DETAIL-EDIT | Registration Detail (edit mode) | Row 3, Col 3 | BC-UC-05 (edit) |
| QR-SCAN | QR Code Scanner | Row 3, Col 4 | BC-UC-07 |
| QR-VERIFY-SUCCESS | QR Verification Success | Row 3, Col 4 variant | BC-UC-07 (success) |
| QR-VERIFY-FAIL | QR Verification Error | Row 3, Col 4 variant | BC-UC-07 (error) |

---

## 2. Shared Layout Structure

All BC screens share a consistent layout:

```
┌─────────────────────────────────────────────────────┐
│ Header Bar (LifeLine logo + staff name + avatar)    │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Content Area                            │
│ (dark)   │  ┌─────────────────────────────────────┐ │
│          │  │ Page Title + Action Buttons          │ │
│ - Dashboard│ │                                     │ │
│ - Campaign │ │ Table / Form / Detail Content       │ │
│ - Inventory│ │                                     │ │
│ - Content  │ │                                     │ │
│ - Notif.   │ └─────────────────────────────────────┘ │
│ - Settings │                                        │
└──────────┴──────────────────────────────────────────┘
```

- **Sidebar**: Dark background (`bg-slate-800`), white text, LifeLine logo at top, red accent on active menu item.
- **Header**: White bar with search, notification bell icon, staff profile avatar.
- **Content Area**: White/light-gray background, padded (`p-6`).

---

## 3. Screen-by-Screen Functional Requirements

### 3.1 CAM-LIST — Campaign List Page (BC-UC-02)

**Purpose**: Display all donation campaigns in a searchable, sortable table.

**UI Elements**:
- Page title: "Campaign Management"
- **"Create Campaign" button** (red, top-right) → triggers BC-UC-01
- **Search bar** (text input, top-left of table area)
- **Filter/Sort controls**: by status (Draft/Active/Full/Closed/Cancelled), date range
- **Data table** columns:
  - Campaign Name
  - Venue / Location
  - Start Date – End Date (ISO 8601, `NFR-STD-03`)
  - Target Blood Groups (badge chips)
  - Capacity / Registered Count (e.g., "45/100")
  - Status (color-coded badge: Draft=gray, Active=green, Full=amber, Closed=red, Cancelled=slate)
  - Actions (View Detail button)
- **Pagination** at table bottom (per `NFR-P` performance requirements)
- **Empty State**: "No campaigns found" illustration when list is empty (BC-UC-02 AF-01)

**Data Binding** (from `DatabaseSchema.md → CAMPAIGN`):
```typescript
interface Campaign {
  _id: string;
  bloodCenterId: string;
  name: string;
  venue: string;
  location: GeoJSONPoint;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  targetBloodGroups: string[];
  capacity: number;
  registeredCount: number;
  status: 'Draft' | 'Active' | 'Full' | 'Closed' | 'Cancelled';
  createdAt: string;
}
```

**API Endpoint**: `GET /api/v1/bc/campaigns` (paginated, filterable)

**Performance**: Table must load within 3 seconds (`NFR-P-05`).

---

### 3.2 CAM-CREATE — Create Campaign Form (BC-UC-01)

**Purpose**: Multi-field form for creating a new donation campaign.

**UI Elements**:
- Page/Modal title: "Create New Campaign"
- Form fields:
  - Campaign Name (text input, required)
  - Venue (text input, required)
  - Location (map picker or address autocomplete)
  - Start Date & Time (datetime picker, required)
  - End Date & Time (datetime picker, required, must be > start date)
  - Target Blood Groups (multi-select checkboxes: A+, A-, B+, B-, AB+, AB-, O+, O-)
  - Participant Capacity (number input, required, > 0)
- **"Save" button** (red, primary) → submits form
- **"Cancel" button** (gray, secondary) → triggers confirmation dialog (AF-02)
- **Validation**: inline field-level errors displayed immediately (AF-01)

**Form Rules** (derived from `UseCaseSpec.md BC-UC-01`):
- All fields marked with `*` are required
- `endDateTime > startDateTime` (validation rule)
- `capacity > 0` (validation rule)
- On missing fields → highlight red border + error message below field
- On cancel → show discard confirmation dialog

**API Endpoint**: `POST /api/v1/bc/campaigns`

---

### 3.3 CAM-DETAIL — Campaign Detail View/Edit (BC-UC-03)

**Purpose**: View and optionally edit a campaign's detailed information.

**UI Elements (View Mode)**:
- Breadcrumb: Campaign Management > [Campaign Name]
- Campaign info displayed in read-only card sections
- **"Edit" button** → switches to edit mode
- **"Registration List" button** → navigates to REG-LIST (BC-UC-03 AF-02)
- Campaign stats summary (registered vs capacity, progress bar)

**UI Elements (Edit Mode)**:
- Same fields as Create form, pre-filled with current values
- **"Save" button** + **"Cancel" button** (with confirmation dialog)

**States**:
- **Loading**: Skeleton loader for campaign detail card
- **Not Found**: Error state with "Campaign not found" + "Go Back" button (AF-01)
- **Edit Success**: Toast notification "Campaign updated successfully"
- **Edit Failure**: Error toast "Failed to update campaign" (AF-04)

**API Endpoints**:
- `GET /api/v1/bc/campaigns/:campaignId`
- `PUT /api/v1/bc/campaigns/:campaignId`

---

### 3.4 REG-LIST — Donor Registration List (BC-UC-04)

**Purpose**: Display all donor registrations for a selected campaign.

**UI Elements**:
- Page title: "Registration List" (with campaign name as subtitle)
- **"QR Scan" button** (red) → navigates to QR-SCAN (BC-UC-04 AF-04)
- **Search bar** with auto-suggestions by Registration ID (BC-UC-06)
- **Filter controls**: by status (Registered/CheckedIn/Eligible/Completed/Ineligible)
- **Data table** columns:
  - Registration ID / Appointment ID
  - Donor Full Name
  - Blood Type (badge)
  - Appointment Date
  - Status (color-coded badge)
  - Actions (View Detail)
- **Pagination**
- **Empty State**: "No registrations for this campaign" (AF-01)

**Data Binding** (from `DatabaseSchema.md → APPOINTMENT + DONOR_PROFILE + DIGITAL_DONOR_RECORD`):
- Joined view: Appointment + Donor Name + Blood Type + Screening Status

**API Endpoint**: `GET /api/v1/bc/campaigns/:campaignId/registrations`

---

### 3.5 REG-DETAIL — Registration Detail View/Edit (BC-UC-05)

**Purpose**: View donor profile, screening info, donation status. Staff can edit screening results.

**UI Elements (View Mode)**:
- **Donor Profile Section**: Avatar, Full Name, Blood Type, Date of Birth, CCCD (masked `****XXXX`), Contact Info, Donation History count
- **Screening Information Section**: Blood Pressure, Weight, Body Temperature, Hemoglobin Level, Screening Notes, Eligibility Flag
- **Donation Status**: Current status badge (Registered → CheckedIn → Eligible → Completed or Ineligible)
- **Status History Timeline**: chronological status changes

**UI Elements (Edit Mode)**:
- Editable fields: Blood Pressure, Weight, Body Temperature, Hemoglobin Level, Screening Notes
- **Donor Status dropdown**: Eligible / Ineligible / Donation Completed
- **"Save" button** + **"Cancel" button**

**Security Note**: CCCD and medical data display must comply with `NFR-STD-01` (Personal Data Protection). CCCD numbers must be partially masked in the UI.

**API Endpoints**:
- `GET /api/v1/bc/registrations/:registrationId`
- `PUT /api/v1/bc/registrations/:registrationId`

---

### 3.6 REG-SEARCH — Search Donor Registration (BC-UC-06)

**Purpose**: Real-time search with auto-suggestions within the Registration List.

**UI Behavior**:
- As staff types in search bar, system shows dropdown of matching Registration IDs
- Matching is by Registration ID prefix, Donor Name partial match
- Press Enter → filter table to show matching results
- **Empty result**: "No matching records found" (AF-01)

**Performance**: Suggestions must appear within 1 second. Results within 2 seconds.

**API Endpoint**: `GET /api/v1/bc/campaigns/:campaignId/registrations?search=<query>`

---

### 3.7 QR-SCAN — QR Code Scan & Verification (BC-UC-07)

**Purpose**: Camera-based QR scanning to verify donor registration tickets.

**UI Elements**:
- Camera viewport (centered, with scan guide overlay)
- "Scanning..." status indicator
- **Success State**: Green checkmark + donor name + "View Registration" button → navigates to REG-DETAIL
- **Error State**: Red X + "Invalid QR Code" or "Registration Not Found" message + "Retry" button
- **Scanner Failure State**: "Camera not available" + "Retry" button (AF-03)

**Technical Notes**:
- Uses `getUserMedia` API for camera access (per `SystemArchitecture.md §3.2`)
- QR decode via `jsQR` / `zxing-js` (client-side)
- Decoded payload sent to server for validation: `POST /api/v1/bc/qr/verify`
- Cryptographic signature verification happens server-side (Ed25519/ECDSA)

---

## 4. Cross-Cutting Concerns

### 4.1 Responsive Design (`NFR-U-01`)

> **Note**: Figma only provides desktop layout. The following responsive specs are **spec-defined** to satisfy `NFR-U-01`.

#### 4.1.1 Global Layout Breakpoints

| Breakpoint | Sidebar | Header | Content Padding |
| :--- | :--- | :--- | :--- |
| **Desktop** (≥1280px) | Fixed visible (width: 256px) | Full width minus sidebar | `p-6` (24px) |
| **Tablet** (768–1279px) | Collapsible icon-only (width: 64px) or overlay | Full width | `p-4` (16px) |
| **Mobile** (≤767px) | Hidden — hamburger menu or bottom nav | Compact (logo + hamburger + avatar) | `p-3` (12px) |

#### 4.1.2 Campaign List Page (BC-UC-02)

| Breakpoint | Layout |
| :--- | :--- |
| **Desktop** | Full table (all 7 columns), search bar + filters inline, "Create" button top-right |
| **Tablet** | Table with 5 priority columns (Name, Date, Blood Groups, Status, Actions), horizontal scroll for remaining |
| **Mobile** | Table → **card list** view, search bar full-width, "Create" button as floating action button (FAB) |

**Mobile Campaign Card**:
```
┌─────────────────────────────┐
│  Spring Blood Drive 2026    │
│  ───────────────────────── │
│  📍 City Hall, District 1   │
│  📅 Jul 20 – Jul 25, 2026  │
│  🩸 A+ B+ O+ O-            │
│  👥 45 / 100 registered     │
│  Status: 🟢 Active          │
│                    [View →] │
└─────────────────────────────┘
```

#### 4.1.3 Create/Edit Campaign Form (BC-UC-01, BC-UC-03)

| Breakpoint | Layout |
| :--- | :--- |
| **Desktop** | Centered form (max-width: 720px), 2-column grid for date fields |
| **Tablet** | Full-width form, 2-column date fields |
| **Mobile** | Full-width form, all fields single column stacked, blood group checkboxes in 2×4 grid |

#### 4.1.4 Registration List (BC-UC-04)

| Breakpoint | Layout |
| :--- | :--- |
| **Desktop** | Full table, "QR Scan" button top-right |
| **Tablet** | Table with 4 priority columns + horizontal scroll |
| **Mobile** | Card list, "QR Scan" as FAB (bottom-right, red circle with camera icon) |

#### 4.1.5 Registration Detail (BC-UC-05)

| Breakpoint | Layout |
| :--- | :--- |
| **Desktop** | Two-column: Donor Profile (left 40%) + Screening/Status (right 60%) |
| **Tablet** | Single column, Donor Profile card on top, Screening form below |
| **Mobile** | Single column stacked, compact cards, screening fields full-width |

#### 4.1.6 QR Scanner (BC-UC-07)

| Breakpoint | Layout |
| :--- | :--- |
| **Desktop** | Centered scanner viewport (max-width: 480px), result below |
| **Tablet** | Centered viewport (max-width: 400px) |
| **Mobile** | Full-screen scanner viewport, result overlay at bottom |

### 4.2 Internationalization (`NFR-U-02`)
- All UI strings must use `i18next` translation keys (Vi/En)
- No hardcoded Vietnamese or English text in JSX
- Translation files: `src/frontend/src/i18n/vi.json`, `en.json`

### 4.3 Accessibility (`NFR-STD-05`)
- WCAG 2.1 Level AA
- All interactive elements have unique IDs
- ARIA labels on all form inputs
- Keyboard navigation support for table rows and modal dialogs
- Color contrast ratios ≥ 4.5:1

### 4.4 Error Handling
- All API errors display consistent toast notifications
- Network errors show "Connection Error" with retry button
- Form validation errors show inline below each field (red text + red border)

---

## 5. Figma vs. UseCaseSpec Alignment Review

| Figma Screen | Matches UC? | Notes |
| :--- | :--- | :--- |
| Campaign List with table | ✅ BC-UC-02 | Sorting, filtering, pagination all present |
| Create Campaign form | ✅ BC-UC-01 | All required fields visible, cancel dialog present |
| Campaign Detail view/edit | ✅ BC-UC-03 | Has "Registration List" button per AF-02 |
| Registration List table | ✅ BC-UC-04 | Has QR Scan button per AF-04 |
| Registration Detail view/edit | ✅ BC-UC-05 | Screening fields + status dropdown present |
| Search within Registration | ✅ BC-UC-06 | Search bar with suggestions visible |
| QR Scanner | ✅ BC-UC-07 | Camera viewport + success/error states |
| Confirmation Dialog | ✅ All cancel flows | Reusable discard/continue dialog |

> **⚠ Potential Gap**: Figma design does not explicitly show a "Loading" skeleton state or an "Empty State" illustration for when no campaigns exist. These should be implemented per `UseCaseSpec.md` AF flows even if not visually designed in Figma.

> **⚠ Design Observation**: The Figma shows a dark sidebar with red accent — consistent with Blood Center branding. The sidebar navigation items visible include: Dashboard, Campaign, Inventory, Content, Notifications. This matches the expected BC module structure.
