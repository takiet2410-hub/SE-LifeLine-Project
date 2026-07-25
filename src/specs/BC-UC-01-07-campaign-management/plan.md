# Plan: BC-UC-01 → BC-UC-07 — Campaign Management (Frontend)

> **Module**: `src/frontend/src/modules/campaign-mgmt/`
> **Stack**: React + TypeScript (strict) + Tailwind CSS + React Query + i18next
> **Reference**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-01-07-campaign-management/spec.md)

---

## 1. Component Architecture

```
src/frontend/src/modules/campaign-mgmt/
├── pages/
│   ├── CampaignListPage.tsx           # BC-UC-02 main page
│   ├── CreateCampaignPage.tsx         # BC-UC-01 form page
│   ├── CampaignDetailPage.tsx         # BC-UC-03 view/edit page
│   ├── RegistrationListPage.tsx       # BC-UC-04 table page
│   ├── RegistrationDetailPage.tsx     # BC-UC-05 view/edit page
│   └── QRScanPage.tsx                 # BC-UC-07 scanner page
│
├── components/
│   ├── CampaignTable.tsx              # Reusable campaign data table
│   ├── CampaignForm.tsx               # Shared form for create/edit
│   ├── CampaignStatusBadge.tsx        # Status variant badge (Draft/Active/Full/Closed/Cancelled)
│   ├── CampaignStatsSummary.tsx       # Registered vs Capacity progress bar
│   ├── RegistrationTable.tsx          # Donor registration data table
│   ├── RegistrationSearchBar.tsx      # Auto-suggest search (BC-UC-06)
│   ├── DonorProfileCard.tsx           # Read-only donor info section
│   ├── ScreeningForm.tsx              # Editable screening fields
│   ├── DonationStatusSelect.tsx       # Status dropdown with valid transitions
│   ├── QRScanner.tsx                  # Camera + jsQR integration
│   ├── QRVerificationResult.tsx       # Success/Error result display
│   ├── BloodGroupBadges.tsx           # Multi-select blood group chips
│   └── ConfirmDiscardDialog.tsx       # Reusable "Discard changes?" modal
│
├── hooks/
│   ├── useCampaigns.ts                # React Query: GET /api/v1/bc/campaigns (list, paginated)
│   ├── useCampaign.ts                 # React Query: GET /api/v1/bc/campaigns/:id (single)
│   ├── useCreateCampaign.ts           # React Query mutation: POST /api/v1/bc/campaigns
│   ├── useUpdateCampaign.ts           # React Query mutation: PUT /api/v1/bc/campaigns/:id
│   ├── useRegistrations.ts            # React Query: GET /api/v1/bc/campaigns/:id/registrations
│   ├── useRegistration.ts             # React Query: GET /api/v1/bc/registrations/:id
│   ├── useUpdateRegistration.ts       # React Query mutation: PUT /api/v1/bc/registrations/:id
│   ├── useRegistrationSearch.ts       # Debounced search with auto-suggestions
│   └── useQRVerify.ts                 # React Query mutation: POST /api/v1/bc/qr/verify
│
├── schemas/
│   ├── campaignSchema.ts              # Zod schema for campaign form validation
│   ├── registrationSchema.ts          # Zod schema for screening form validation
│   └── qrVerifySchema.ts             # Zod schema for QR payload validation
│
├── types/
│   └── campaign.types.ts              # TypeScript interfaces (derived from Zod via z.infer)
│
└── i18n/
    ├── campaign.vi.json               # Vietnamese translations
    └── campaign.en.json               # English translations
```

---

## 2. Shared / Common Components (from `src/frontend/src/components/common/`)

These components are shared across ALL BC modules, not just campaign-mgmt:

| Component | Purpose |
| :--- | :--- |
| `AppLayout.tsx` | Main layout with Sidebar + Header + Content Area |
| `Sidebar.tsx` | Dark sidebar navigation (Dashboard/Campaign/Inventory/Content/Notifications) |
| `Header.tsx` | Top bar with search, notification bell, staff avatar |
| `DataTable.tsx` | Generic paginated, sortable table component |
| `StatusBadge.tsx` | Generic color-coded status badge |
| `ConfirmDialog.tsx` | Generic confirmation modal |
| `SkeletonLoader.tsx` | Loading skeleton for pages/cards |
| `EmptyState.tsx` | "No data" illustration component |
| `Toast.tsx` | Notification toast (success/error/warning) |
| `FormField.tsx` | Standardized form field with label, input, error message |

---

## 3. State Management Strategy

| State Type | Solution | Scope |
| :--- | :--- | :--- |
| Server state (campaign list, registration list) | **React Query** (`@tanstack/react-query`) | Per-page, cached |
| Form state (create/edit forms) | **React Hook Form** + **Zod** resolver | Per-form |
| UI state (modal open/close, edit mode toggle) | `useState` / `useReducer` | Per-component |
| Global state (current user, sidebar collapsed) | **Zustand** or **React Context** | App-wide |
| URL state (pagination, filters, search) | **URL search params** (`useSearchParams`) | Per-page |

---

## 4. Routing Plan

```typescript
// React Router v6 routes under /bc (Blood Center)
const campaignRoutes = [
  { path: '/bc/campaigns',              element: <CampaignListPage /> },       // BC-UC-02
  { path: '/bc/campaigns/create',       element: <CreateCampaignPage /> },     // BC-UC-01
  { path: '/bc/campaigns/:campaignId',  element: <CampaignDetailPage /> },     // BC-UC-03
  { path: '/bc/campaigns/:campaignId/registrations',
                                         element: <RegistrationListPage /> },   // BC-UC-04
  { path: '/bc/campaigns/:campaignId/registrations/:registrationId',
                                         element: <RegistrationDetailPage /> }, // BC-UC-05
  { path: '/bc/campaigns/:campaignId/qr-scan',
                                         element: <QRScanPage /> },            // BC-UC-07
];
```

---

## 5. API Integration Layer

All API calls go through a shared Axios instance configured with:
- Base URL: `/api/v1`
- JWT access token in `Authorization: Bearer <token>` header
- Automatic token refresh on 401
- Consistent error handling → toast notifications

### Endpoint Summary

| Method | Path | UC | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/bc/campaigns` | BC-UC-02 | List campaigns (paginated, filterable) |
| POST | `/bc/campaigns` | BC-UC-01 | Create campaign |
| GET | `/bc/campaigns/:id` | BC-UC-03 | Get campaign detail |
| PUT | `/bc/campaigns/:id` | BC-UC-03 | Update campaign |
| GET | `/bc/campaigns/:id/registrations` | BC-UC-04 | List registrations |
| GET | `/bc/campaigns/:id/registrations?search=` | BC-UC-06 | Search registrations |
| GET | `/bc/registrations/:id` | BC-UC-05 | Get registration detail |
| PUT | `/bc/registrations/:id` | BC-UC-05 | Update screening/status |
| POST | `/bc/qr/verify` | BC-UC-07 | Verify QR code |

---

## 6. Validation Schemas (Zod)

```typescript
// campaignSchema.ts
import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  venue: z.string().min(1, 'Venue is required'),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  targetBloodGroups: z.array(z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']))
    .min(1, 'Select at least one blood group'),
  capacity: z.number().int().positive('Capacity must be > 0'),
}).refine(data => new Date(data.endDateTime) > new Date(data.startDateTime), {
  message: 'End date must be after start date',
  path: ['endDateTime'],
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
```

```typescript
// registrationSchema.ts
import { z } from 'zod';

export const updateScreeningSchema = z.object({
  bloodPressure: z.string().optional(),
  weight: z.number().positive().optional(),
  bodyTemperature: z.number().positive().optional(),
  hemoglobinLevel: z.number().positive().optional(),
  screeningNotes: z.string().optional(),
  donationStatus: z.enum(['Registered', 'CheckedIn', 'Eligible', 'Completed', 'Ineligible']),
});

export type UpdateScreeningInput = z.infer<typeof updateScreeningSchema>;
```

---

## 7. Styling Approach

- **Tailwind CSS utility classes** only (no custom CSS files)
- Design tokens from Figma mapped to `tailwind.config.ts` `extend.colors`:
  ```typescript
  colors: {
    lifeline: {
      red: '#DC2626',
      'red-hover': '#B91C1C',
    },
    sidebar: {
      bg: '#1E293B',
      active: '#DC2626',
    }
  }
  ```
- Inter font loaded via Google Fonts CDN in `index.html`
- Responsive breakpoints follow Tailwind defaults (sm/md/lg/xl)

---

## 8. Dependencies

| Package | Purpose |
| :--- | :--- |
| `@tanstack/react-query` | Server state management |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod resolver for react-hook-form |
| `zod` | Schema validation |
| `react-router-dom` | Client-side routing |
| `i18next` + `react-i18next` | Internationalization |
| `axios` | HTTP client |
| `jsqr` or `@aspect-enterprise/zxing-js` | QR code decoding |
| `lucide-react` | Icons |
| `date-fns` | Date formatting (ISO 8601) |
| `sonner` or `react-hot-toast` | Toast notifications |
