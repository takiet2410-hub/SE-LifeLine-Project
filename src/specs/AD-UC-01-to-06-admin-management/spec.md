# Spec: AD-UC-01 → AD-UC-06 — Admin Management System

> **Spec-Kit Artifact** | **Covers**: AD-UC-01 (User List), AD-UC-02 (User Form / Provisioning), AD-UC-03 (Roles & Permissions), AD-UC-04 (Monitoring & Activity Logs), AD-UC-05 (System Config), AD-UC-06 (Feature Toggles)  
> **Actor**: System / Platform Administrator  
> **Module**: `src/frontend/src/modules/admin/`, `src/backend-core/src/modules/admin/`  
> **Updated**: 2026-08-13 — Formatted per LifeLine Spec-Kit standard

---

## 1. Feature Overview & Scope

The **Admin Management System** provides centralized governance, security access control, activity auditing, system monitoring, dynamic system parameters, and feature flag management across the LifeLine platform. It ensures that Administrators can maintain user accounts, enforce granular Role-Based Access Control (RBAC), audit all security events, monitor platform health, and control feature deployment without requiring server restarts.

### 1.1 Use Case Mapping

| Use Case ID | Name | Description | Primary Actor | Target Module / Page |
| :--- | :--- | :--- | :--- | :--- |
| **AD-UC-01** | View & Filter User List | Paginated list, role filtering, keyword search, CSV export | Administrator | `UserListPage.tsx` |
| **AD-UC-02** | Manage User Accounts | Create, update profile/role, soft delete / reactivate users | Administrator | `UserFormPage.tsx` |
| **AD-UC-03** | Manage Roles & Permissions | View roles and configure permission assignment matrix | Administrator | `RoleManagementPage.tsx` |
| **AD-UC-04** | Activity Audit Logs & System Health | View/export system audit logs, metrics dashboard, run diagnostics | Administrator | `ActivityLogsPage.tsx`, `AdminDashboardPage.tsx` |
| **AD-UC-05** | Manage System Configurations | Read & update dynamic system parameters (SLA thresholds, limits) | Administrator | `SystemConfigPage.tsx` |
| **AD-UC-06** | Manage Feature Toggles | Switch feature flags on/off with target role scoping | Administrator | `FeatureTogglesPage.tsx` |

---

## 2. User Scenarios & Testing

### User Story 1 - User Account Administration (AD-UC-01, AD-UC-02) (Priority: P1) 🎯 MVP

As an Administrator, I want to manage platform user accounts so that user roles are assigned correctly and access can be revoked instantly when necessary.

- **Why this priority**: Core administrative prerequisite for platform security and user management.
- **Independent Test**: Log in as Admin, navigate to `/admin/users`, create a user, update their role/hospital, soft-delete, and export the list to CSV.

**Acceptance Scenarios**:
1. **Given** an Admin on `/admin/users`, **When** filtering by role (e.g., `HospitalStaff`) and searching by keyword, **Then** matching active user records are returned with pagination.
2. **Given** an Admin submitting `UserFormPage`, **When** valid user details are provided, **Then** the user is created/updated in MongoDB and cached tokens invalidated if updated.
3. **Given** an Admin clicking "Delete", **When** confirmed, **Then** `isDeleted` is set to `true`, revoking access immediately without hard-deleting historical transactions.
4. **Given** an Admin clicking "Export CSV", **When** triggered, **Then** a `.csv` file containing the filtered user list is downloaded.
5. **Given** a suspended user requests a fresh registration, **When** an Admin confirms a privacy purge, **Then** personal identifiers are anonymized transactionally, disposable personal data is removed, historical transactions retain a pseudonymous reference, and the original email/CCCD become reusable.

---

### User Story 2 - Role & Permission Governance (AD-UC-03) (Priority: P2)

As a Security Administrator, I want to manage role definitions and permission matrices so that users operate under the Principle of Least Privilege.

- **Why this priority**: Mandatory for security compliance and RBAC access control.
- **Independent Test**: Open `/admin/roles`, toggle permissions for a target role (e.g. `Volunteer`), save changes, and verify authorization behavior on protected endpoints.

**Acceptance Scenarios**:
1. **Given** the Role Management page, **When** selecting a role, **Then** all assigned permissions are visually checked alongside available system permissions.
2. **Given** updated permission selections, **When** saved, **Then** the role document is updated in MongoDB and role permission cache cleared.

---

### User Story 3 - Activity Audit Logs & System Health (AD-UC-04) (Priority: P3)

As a System Administrator, I want to monitor platform KPIs and audit security log entries so that operational issues and security incidents can be investigated.

- **Why this priority**: Essential for operational visibility, system health monitoring, and security audit compliance.
- **Independent Test**: Access `/admin/dashboard` to inspect KPIs and run diagnostics, then open `/admin/logs` to search log records by actor/action and export CSV.

**Acceptance Scenarios**:
1. **Given** the Admin Dashboard, **When** loaded, **Then** KPIs (total users, active blood drives, urgent request status, health metrics) display with auto-refresh capability.
2. **Given** the Activity Logs browser, **When** filtering by action (e.g., `USER_UPDATE`, `CONFIG_CHANGE`), **Then** log entries with timestamps, actor email, IP address, and payload details are returned.
3. **Given** the "Run Diagnostics" button, **When** clicked, **Then** MongoDB, Redis, and external notification service health statuses are reported.

---

### User Story 4 - System Configuration & Feature Toggles (AD-UC-05, AD-UC-06) (Priority: P4)

As an Administrator, I want to modify system configuration parameters and toggle feature flags dynamically without redeploying code.

- **Why this priority**: Provides high operational flexibility during emergency situations or staged feature rollouts.
- **Independent Test**: Access `/admin/config` to adjust system constants, and `/admin/toggles` to flip feature flags on/off.

**Acceptance Scenarios**:
1. **Given** the System Config page, **When** updating a key-value parameter (e.g., `MAX_RESERVATION_HOURS = 4`), **Then** the backend immediately uses the new value.
2. **Given** the Feature Toggles page, **When** switching a flag (e.g., `enable_ai_matching = true`), **Then** the status update persists and affects system behavior immediately.

---

## 3. Edge Cases & Boundary Conditions

- **Self-Demotion / Self-Deletion Prevention**: An Administrator CANNOT soft-delete or remove the `Administrator` role from their own active account.
- **Concurrent Modification Protection**: Role permission matrix updates use optimistic concurrency control (`__v` versioning) to prevent race conditions.
- **Soft-Deleted Email Reuse**: Attempting to create a user with an email belonging to a soft-deleted record prompts the admin to restore the account instead of failing silently.
- **Feature Flag Service Fallback**: If MongoDB connection drops, feature flag evaluation returns hardcoded safe defaults (`false`).

---

## 4. Functional Requirements Summary

- **FR-AD-001**: System MUST strictly enforce `authenticateJWT` and `authorizeRoles('Administrator')` on all `/api/admin/*` endpoints.
- **FR-AD-002**: System MUST support paginated user listing with keyword search and role/status filtering.
- **FR-AD-003**: System MUST provide streaming CSV export for user records and activity logs.
- **FR-AD-004**: System MUST perform soft-deletes (`isDeleted: true`) by default, support restoration, and provide a separate transactional privacy-purge workflow that releases identifiers without deleting historical transactions.
- **FR-AD-005**: System MUST allow editing user attributes, assigned role, and hospital association.
- **FR-AD-006**: System MUST persist role and permission mapping in database records.
- **FR-AD-007**: System MUST record structured activity log entries (`ActivityLog`) for all administrative mutations.
- **FR-AD-008**: System MUST provide a real-time dashboard displaying key platform metrics and diagnostic health checks.
- **FR-AD-009**: System MUST support reading and updating key-value system configuration parameters.
- **FR-AD-010**: System MUST support feature toggle management (key, name, description, enabled, targetedRoles).

---

## 5. Non-Functional Requirements & Success Criteria

- **SC-AD-001**: Admin dashboard loads key operational metrics within 1.5 seconds.
- **SC-AD-002**: User search and filter queries respond in under 500ms for datasets up to 100,000 user records.
- **SC-AD-003**: 100% of administrative mutations generate an audit log entry.
- **SC-AD-004**: Feature flag status updates take effect system-wide within 5 seconds without server restart.
- **SC-AD-005**: 0 unauthorized non-admin access attempts succeed on `/api/admin/*` routes.
