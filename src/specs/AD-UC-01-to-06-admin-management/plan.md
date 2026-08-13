# Implementation Plan: Admin Management System (AD-UC-01 → AD-UC-06)

**Feature Branch**: `AD-UC-01-to-06-admin-management` | **Date**: 2026-08-13  
**Spec**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/AD-UC-01-to-06-admin-management/spec.md)

---

## 1. Summary

The Admin Management System provides centralized administration, user account management, role & permission governance, system monitoring, dynamic configuration, and feature toggle management. The backend is built on Express.js with TypeScript and Mongoose/MongoDB, while the frontend is built using React with TypeScript, Vite, Tailwind CSS, Lucide icons, and React Query/Context.

---

## 2. Technical Context

- **Language/Version**: TypeScript 5.x (Node.js v18+ backend core, React 18 frontend)
- **Primary Dependencies**:
  - **Backend**: Express.js, Mongoose (MongoDB ODM), JsonWebToken (JWT), bcryptjs
  - **Frontend**: React, React Router v6, Axios/Fetch API, Tailwind CSS, Lucide React icons
- **Storage**: MongoDB (Mongoose models for User, Role, ActivityLog, SystemConfig, FeatureToggle)
- **Testing**: Jest / Supertest (Backend API tests), Vitest / React Testing Library (Frontend UI tests)
- **Target Platform**: Express core API server (`/api/admin/*`) + Vite React SPA web app
- **Performance Goals**: API response time < 200ms, Dashboard metrics load < 1.5s
- **Constraints**: Enforce strictly `authenticateJWT` and `authorizeRoles('Administrator')` on all `/api/admin/*` routes. Soft-delete users (`isDeleted: true`).

---

## 3. Project Structure

### Documentation & Spec Kit (`src/specs/AD-UC-01-to-06-admin-management/`)

```text
src/specs/AD-UC-01-to-06-admin-management/
├── spec.md                       # Feature specification & requirements
├── plan.md                       # Technical implementation plan
├── tasks.md                      # Task breakdown & execution roadmap
├── research.md                   # Technical research & architectural decisions
├── data-model.md                 # MongoDB data schemas & validation rules
├── quickstart.md                 # Setup and cURL validation guide
├── contracts/
│   └── admin-api-contract.md     # REST API endpoint contracts & payloads
└── checklists/
    └── requirements.md           # Quality assurance & verification checklist
```

### Source Code Architecture

```text
src/
├── backend-core/
│   └── src/
│       └── modules/
│           └── admin/
│               ├── admin.routes.ts                # Express Router (/api/admin/*)
│               ├── controllers/
│               │   └── admin.controller.ts        # Request handlers & response formatting
│               ├── models/
│               │   ├── activity-log.model.ts      # ActivityLog Mongoose schema
│               │   ├── feature-toggle.model.ts    # FeatureToggle Mongoose schema
│               │   ├── role-permission.model.ts   # Role Mongoose schema
│               │   └── system-config.model.ts     # SystemConfig Mongoose schema
│               └── services/
│                   ├── admin-user.service.ts      # User CRUD & export business logic
│                   ├── admin-role.service.ts      # Role & permission governance service
│                   ├── admin-monitoring.service.ts# System health KPIs & logs service
│                   ├── admin-config.service.ts    # Dynamic config management service
│                   └── admin-toggle.service.ts    # Feature flag evaluation & mutation
└── frontend/
    └── src/
        └── modules/
            └── admin/
                ├── api/                           # Admin API clients & endpoints
                ├── components/                    # Reusable admin UI components & modals
                ├── pages/
                │   ├── AdminDashboardPage.tsx     # KPI metrics & health check dashboard
                │   ├── UserListPage.tsx           # User listing, filtering, search, export
                │   ├── UserFormPage.tsx           # Create / Edit user form
                │   ├── RoleManagementPage.tsx     # Role & permission matrix editor
                │   ├── ActivityLogsPage.tsx       # System activity log viewer & export
                │   ├── SystemConfigPage.tsx       # Dynamic system parameter management
                │   └── FeatureTogglesPage.tsx     # Feature flag toggle dashboard
                └── types/                         # TypeScript interfaces & types for admin
```

---

## 4. Component Specifications

### 4.1 Backend Core (`src/backend-core/src/modules/admin`)
- **`admin.routes.ts`**: Protects all sub-routes with `authenticateJWT` and `authorizeRoles('Administrator')`.
- **`AdminController`**:
  - `getUsers`, `createUser`, `updateUser`, `softDeleteUser`, `exportUsersCsv`
  - `getRoles`, `updateRolePermissions`
  - `getActivityLogs`, `exportLogsCsv`, `getDashboardMetrics`, `runDiagnostics`
  - `getConfigs`, `updateConfig`
  - `getToggles`, `updateToggle`
- **Audit Interceptor**: Every administrative mutation creates an `ActivityLog` document storing actor ID, IP address, target entity, and timestamp.

### 4.2 Frontend Module (`src/frontend/src/modules/admin`)
- **Pages**:
  - `AdminDashboardPage`: Renders real-time statistics cards, recent audit activities, system status overview.
  - `UserListPage`: Renders paginated table, role filter tabs, search bar, CSV export button, action drop-down.
  - `UserFormPage`: Modal/Form for account provisioning and role/hospital assignment.
  - `RoleManagementPage`: Interactive permission matrix toggle per role.
  - `ActivityLogsPage`: Filterable log table with search by user/action and CSV export.
  - `SystemConfigPage`: Parameter key-value editor with instant persistence.
  - `FeatureTogglesPage`: Switch toggles for feature flags with targeted role support.

---

## 5. Verification & Testing Plan

### Automated Tests
- **API Integration Tests**: Run `npm test` in backend core to verify `/api/admin/*` endpoint security and business logic.
- **Frontend Component Tests**: Verify page rendering and state changes in React pages.

### Manual Verification
1. **RBAC Verification**: Access `/api/admin/*` endpoints using non-admin JWT; verify `403 Forbidden` response.
2. **User Management Workflow**: Create user -> edit user -> soft delete user -> verify `isDeleted: true` and export CSV.
3. **Role & Permission Workflow**: Update permissions for role -> verify persisted matrix.
4. **Monitoring Workflow**: View dashboard metrics -> run diagnostics -> inspect activity logs.
5. **Config & Toggle Workflow**: Update system parameter & toggle feature flag -> verify instant updates.
