# Tasks: Admin Management System (AD-UC-01 → AD-UC-06)

**Input**: Design documents from `/src/specs/AD-UC-01-to-06-admin-management/`
**Prerequisites**: [plan.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/AD-UC-01-to-06-admin-management/plan.md), [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/AD-UC-01-to-06-admin-management/spec.md)

---

## Phase 1: Setup & Infrastructure

- [x] T001 Initialize Speckit specification folder at `src/specs/AD-UC-01-to-06-admin-management/`
- [x] T002 Verify backend route declarations in `src/backend-core/src/modules/admin/admin.routes.ts`
- [x] T003 Verify frontend module structure in `src/frontend/src/modules/admin/`

---

## Phase 2: Foundational (RBAC Security & Schemas)

- [x] T004 Enforce JWT authentication and Administrator role authorization middleware on `/api/admin/*`
- [x] T005 [P] Verify Mongoose schemas: `ActivityLog`, `FeatureToggle`, `RolePermission`, `SystemConfig`
- [x] T006 [P] Verify AdminController methods in `src/backend-core/src/modules/admin/controllers/admin.controller.ts`

---

## Phase 3: User Story 1 - User Account Administration (P1 MVP)

- [x] T007 [P] Implement `getUsers` with pagination, role filtering, and search in `admin-user.service.ts`
- [x] T008 [P] Implement `createUser` and `updateUser` with hospital association in `admin-user.service.ts`
- [x] T009 Implement `softDeleteUser` setting `isDeleted: true` in `admin-user.service.ts`
- [x] T010 Implement `exportUsersCsv` streaming user dataset to CSV download in `admin-user.service.ts`
- [x] T011 Create frontend User List page in `src/frontend/src/modules/admin/pages/UserListPage.tsx`
- [x] T012 Create frontend User Form modal/page in `src/frontend/src/modules/admin/pages/UserFormPage.tsx`

---

## Phase 4: User Story 2 - Role & Permission Governance (P2)

- [x] T013 Implement `getRoles` and `updateRolePermissions` in `admin-role.service.ts`
- [x] T014 Create frontend Role Management page with permission matrix in `src/frontend/src/modules/admin/pages/RoleManagementPage.tsx`

---

## Phase 5: User Story 3 - System Monitoring & Audit Activity Logs (P3)

- [x] T015 Implement `getActivityLogs` with filter & pagination and `exportLogsCsv` in `admin-monitoring.service.ts`
- [x] T016 Implement `getDashboardMetrics` and `runDiagnostics` health checks in `admin-monitoring.service.ts`
- [x] T017 Create frontend Admin Dashboard page in `src/frontend/src/modules/admin/pages/AdminDashboardPage.tsx`
- [x] T018 Create frontend Activity Logs browser page in `src/frontend/src/modules/admin/pages/ActivityLogsPage.tsx`

---

## Phase 6: User Story 4 - System Configuration & Feature Toggles (P4)

- [x] T019 Implement `getConfigs` and `updateConfig` in `admin-config.service.ts`
- [x] T020 Implement `getToggles` and `updateToggle` in `admin-toggle.service.ts`
- [x] T021 Create frontend System Config page in `src/frontend/src/modules/admin/pages/SystemConfigPage.tsx`
- [x] T022 Create frontend Feature Toggles page in `src/frontend/src/modules/admin/pages/FeatureTogglesPage.tsx`

---

## Phase 7: Verification & Audit

- [ ] T023 Run regression tests on `/api/admin/*` endpoints
- [ ] T024 Perform end-to-end verification of user management, audit logs, and feature flag changes
