# Tasks: BC-UC-01 → BC-UC-07 — Campaign Management (Frontend)

> **Reference**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-01-07-campaign-management/spec.md) | [plan.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-01-07-campaign-management/plan.md)
> **Branch**: `feature/BC-UC-01-07-campaign-management`

---

## Phase 0: Setup & Shared Infrastructure

- [ ] **T-0.1**: Install project dependencies
  - `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`
  - `react-router-dom`, `i18next`, `react-i18next`, `axios`
  - `lucide-react`, `date-fns`, `sonner`
  - `jsqr` (QR decoding)

- [ ] **T-0.2**: Configure Tailwind CSS design tokens
  - Add LifeLine custom colors to `tailwind.config.ts` (red-600, sidebar dark, etc.)
  - Add Inter font family

- [ ] **T-0.3**: Build shared layout components
  - `AppLayout.tsx` (Sidebar + Header + Content area wrapper)
  - `Sidebar.tsx` (dark sidebar with nav items: Dashboard, Campaign, Inventory, Content, Notifications)
  - `Header.tsx` (logo bar + search + notification bell + avatar)

- [ ] **T-0.4**: Build reusable common components
  - `DataTable.tsx` (generic paginated, sortable table)
  - `StatusBadge.tsx` (color-mapped status badge)
  - `ConfirmDialog.tsx` (reusable discard/confirm modal)
  - `SkeletonLoader.tsx` (loading placeholder)
  - `EmptyState.tsx` (no-data illustration)
  - `Toast.tsx` (or configure `sonner` provider)
  - `FormField.tsx` (label + input + error message wrapper)

- [ ] **T-0.5**: Set up API client
  - Configure Axios instance with base URL, JWT interceptors, error handling
  - Set up React Query provider with default options

- [ ] **T-0.6**: Set up i18n infrastructure
  - Configure `i18next` with `vi.json` and `en.json` namespace files
  - Create `campaign.vi.json` and `campaign.en.json` translation files

---

## Phase 1: Campaign List & Create (BC-UC-01, BC-UC-02)

- [ ] **T-1.1**: Create Zod validation schemas
  - `src/modules/campaign-mgmt/schemas/campaignSchema.ts`
  - `createCampaignSchema` with all field validators + `endDate > startDate` refinement
  - Export `CreateCampaignInput` type via `z.infer`

- [ ] **T-1.2**: Create TypeScript types
  - `src/modules/campaign-mgmt/types/campaign.types.ts`
  - `Campaign`, `CampaignListResponse`, `CampaignListParams` interfaces

- [ ] **T-1.3**: Create React Query hooks
  - `useCampaigns.ts` — `useQuery` for paginated campaign list
  - `useCreateCampaign.ts` — `useMutation` for campaign creation

- [ ] **T-1.4**: Build `CampaignStatusBadge.tsx`
  - Map status → color (Draft=gray, Active=green, Full=amber, Closed=red, Cancelled=slate)

- [ ] **T-1.5**: Build `BloodGroupBadges.tsx`
  - Multi-select checkbox group for blood types (A+, A−, B+, B−, AB+, AB−, O+, O−)

- [ ] **T-1.6**: Build `CampaignTable.tsx`
  - Columns: Name, Venue, Date Range, Blood Groups, Capacity, Status, Actions
  - Sortable headers, pagination controls

- [ ] **T-1.7**: Build `CampaignListPage.tsx` (BC-UC-02)
  - Search bar + filter controls + CampaignTable
  - "Create Campaign" button (top-right, red)
  - Empty state when no campaigns
  - Loading skeleton state

- [ ] **T-1.8**: Build `CampaignForm.tsx`
  - Shared form component used by both Create and Edit
  - React Hook Form + Zod resolver
  - All fields per spec: name, venue, dates, blood groups, capacity
  - Inline validation error display

- [ ] **T-1.9**: Build `CreateCampaignPage.tsx` (BC-UC-01)
  - Wraps CampaignForm with "Create New Campaign" title
  - Submit → `useCreateCampaign` mutation
  - Cancel → `ConfirmDiscardDialog`
  - Success toast + redirect to campaign list
  - Error toast on failure

- [ ] **T-1.10**: Set up routing
  - `/bc/campaigns` → `CampaignListPage`
  - `/bc/campaigns/create` → `CreateCampaignPage`

---

## Phase 2: Campaign Detail View/Edit (BC-UC-03)

- [ ] **T-2.1**: Create hooks
  - `useCampaign.ts` — `useQuery` for single campaign detail
  - `useUpdateCampaign.ts` — `useMutation` for campaign update

- [ ] **T-2.2**: Build `CampaignStatsSummary.tsx`
  - Registered vs Capacity progress bar with percentage

- [ ] **T-2.3**: Build `CampaignDetailPage.tsx` (BC-UC-03)
  - View mode: read-only campaign info cards + stats summary
  - "Edit" button → switches to edit mode (re-use `CampaignForm`)
  - "Registration List" button → navigate to registration list page
  - Edit mode: CampaignForm pre-filled + Save/Cancel
  - Loading skeleton, Not Found error state
  - Success/Error toast on update

- [ ] **T-2.4**: Add route
  - `/bc/campaigns/:campaignId` → `CampaignDetailPage`

---

## Phase 3: Donor Registration List & Search (BC-UC-04, BC-UC-06)

- [ ] **T-3.1**: Create types & hooks
  - Registration types (joined Appointment + DonorProfile + ScreeningStatus)
  - `useRegistrations.ts` — `useQuery` for registration list (with search param)
  - `useRegistrationSearch.ts` — debounced search with suggestions

- [ ] **T-3.2**: Build `RegistrationSearchBar.tsx` (BC-UC-06)
  - Input with debounce (300ms)
  - Dropdown suggestions list (Registration ID + Donor Name)
  - Enter key triggers full search

- [ ] **T-3.3**: Build `RegistrationTable.tsx`
  - Columns: Reg ID, Donor Name, Blood Type, Appointment Date, Status, Actions
  - Status badges (Registered=blue, CheckedIn=amber, Eligible=green, Completed=emerald, Ineligible=red)

- [ ] **T-3.4**: Build `RegistrationListPage.tsx` (BC-UC-04)
  - Page title with campaign name subtitle
  - "QR Scan" button (red) → navigate to QR page
  - RegistrationSearchBar + filter controls
  - RegistrationTable + pagination
  - Empty state for no registrations

- [ ] **T-3.5**: Add route
  - `/bc/campaigns/:campaignId/registrations` → `RegistrationListPage`

---

## Phase 4: Registration Detail View/Edit (BC-UC-05)

- [ ] **T-4.1**: Create Zod schemas & hooks
  - `registrationSchema.ts` — `updateScreeningSchema`
  - `useRegistration.ts` — `useQuery` for single registration
  - `useUpdateRegistration.ts` — `useMutation`

- [ ] **T-4.2**: Build `DonorProfileCard.tsx`
  - Read-only donor info: Avatar, Name, Blood Type, DOB, CCCD (masked), Contact, Total Donations
  - CCCD display: `****1234` format (per NFR-STD-01)

- [ ] **T-4.3**: Build `ScreeningForm.tsx`
  - Editable fields: Blood Pressure, Weight, Temperature, Hemoglobin, Notes
  - React Hook Form + Zod

- [ ] **T-4.4**: Build `DonationStatusSelect.tsx`
  - Dropdown with valid status transitions only
  - Color-coded options

- [ ] **T-4.5**: Build `RegistrationDetailPage.tsx` (BC-UC-05)
  - View mode: DonorProfileCard + Screening info (read-only) + Status badge + History
  - Edit mode: ScreeningForm + DonationStatusSelect + Save/Cancel
  - Success/Error toast
  - Not Found error state

- [ ] **T-4.6**: Add route
  - `/bc/campaigns/:campaignId/registrations/:registrationId` → `RegistrationDetailPage`

---

## Phase 5: QR Code Scan & Verification (BC-UC-07)

- [ ] **T-5.1**: Create hooks
  - `useQRVerify.ts` — `useMutation` for `POST /bc/qr/verify`

- [ ] **T-5.2**: Build `QRScanner.tsx`
  - Camera access via `getUserMedia`
  - Continuous frame capture + `jsQR` decode
  - Scan guide overlay (viewfinder rectangle)
  - "Scanning..." status indicator
  - Auto-submit decoded payload to verification endpoint

- [ ] **T-5.3**: Build `QRVerificationResult.tsx`
  - Success: Green checkmark + donor name + "View Registration" link
  - Error: Red X + error message + "Scan Again" button
  - States: idle, scanning, verifying, success, error

- [ ] **T-5.4**: Build `QRScanPage.tsx` (BC-UC-07)
  - Full-page scanner view
  - QRScanner + QRVerificationResult
  - Back button to Registration List
  - Camera permission error handling

- [ ] **T-5.5**: Add route
  - `/bc/campaigns/:campaignId/qr-scan` → `QRScanPage`

---

## Phase 6: Integration & Polish

- [ ] **T-6.1**: Wire up all navigation flows
  - Campaign List → Create Campaign
  - Campaign List → Campaign Detail
  - Campaign Detail → Registration List
  - Registration List → Registration Detail
  - Registration List → QR Scan
  - QR Scan (success) → Registration Detail
  - Breadcrumb navigation on all pages

- [ ] **T-6.2**: Add i18n translations
  - Complete `campaign.vi.json` and `campaign.en.json` with all UI strings
  - Ensure all JSX text uses `t('key')` from `useTranslation`

- [ ] **T-6.3**: Responsive design pass
  - Test all pages at desktop (1440px), tablet (768px), mobile (375px)
  - Sidebar collapse on tablet/mobile
  - Table → card view on mobile

- [ ] **T-6.4**: Accessibility pass
  - Add ARIA labels to all form inputs
  - Add unique IDs to all interactive elements
  - Test keyboard navigation (Tab, Enter, Escape)
  - Verify color contrast (WCAG 2.1 AA)

- [ ] **T-6.5**: Error boundary & edge cases
  - Add React Error Boundary around module
  - Handle network offline state
  - Handle JWT token expiry (redirect to login)

---

## Phase 7: Verification

- [ ] **T-7.1**: Run type checking
  - `npx tsc --noEmit` — must pass with zero errors

- [ ] **T-7.2**: Run linting
  - `npm run lint` — must pass

- [ ] **T-7.3**: Visual QC against Figma reference
  - Use `check_reference` tool with `reference.png`
  - Compare spacing, colors, typography, layout alignment

- [ ] **T-7.4**: Functional verification
  - Verify all Basic Flows work end-to-end
  - Verify all Alternative Flows (cancel, error, empty, not found)
  - Verify search auto-suggestions appear < 1 second
  - Verify QR scanner activates camera and decodes correctly

- [ ] **T-7.5**: Update Spec-Kit artifacts
  - Mark completed tasks in this file
  - Update `spec.md` if any deviations from original design
