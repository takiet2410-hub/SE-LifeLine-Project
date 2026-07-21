# Feature Specification: BC-Article-management (Article Management)

**Feature IDs**: BC-UC-08, BC-UC-09  
**Status**: Draft  
**Primary Source Documents**: Use-Case Specification, Database Schema, System Architecture, Coding Conventions, Project Plan, Constitution.

---

## Alignment Notes & Traceability

> [!NOTE]
> **Status Simplification**: This spec aligns article status strictly with the official `UseCaseSpec.md`, which defines only two backend states: `Draft` (AF-02) and `Published` (Basic Flow step 5). No `Live` or `Scheduled` backend states are defined in the source use case, and have been removed from this spec accordingly. If a visual distinction is desired on the UI frontend for Alert-category articles, the word "Live" may be rendered as a badge label when `category = Alert` AND `status = Published`, but `Live` is NOT a separate enum value in the data model or API.

> [!NOTE]
> **Delete Functionality Scope**: Delete functionality is an extension beyond the original `UseCaseSpec.md` (where BC-UC-09 is titled "View/Edit Article"), added per stakeholder request and confirmed via UI mockup review.

---

## 1. Feature Summary

The **Article Management** feature belongs to the Content Management module (`content-news` boundary) of the LifeLine Management System. It allows authorized Blood Center Staff (e.g., Dr. Sarah Chen) to create, view, edit, publish, unpublish, and delete articles. Articles can be categorized as **News**, **Alert**, or **Educational** content, and targeted at specific audiences including **Donors**, **Staff**, and **Hospitals**.

This specification outlines the complete functional requirements, UI/UX workflow, business logic, authorization rules, data structures, and acceptance criteria for two core use cases:
- **BC-UC-08**: Create and Publish Article
- **BC-UC-09**: View/Edit/Delete Article

---

## 2. Scope

### In Scope
- Creation of articles with title, body content, category, target audience, and featured media upload.
- Saving articles as **Draft** or publishing immediately (**Published**).
- Article listing with dashboard metrics: **Total Articles**, **Public Reach**, and **Active Alerts**.
- Numbered pagination for article listings (12 articles per page).
- Dynamic filtering, card display, status badges, and quick action three-dot menu (`⋮`).
- Pre-filled editing of existing articles with direct status toggling (`Draft` ↔ `Published`) and immediate visibility updates without separate approval steps.
- Safe article deletion with user confirmation, soft-delete handling (`deletedAt`), and real-time dashboard statistic recalculation.
- Draft auto-saving mechanism with visual status indicators ("Auto-saved X minutes ago").
- File upload constraints (PNG/JPG, recommended 1200x630px, maximum 5MB).
- Dedicated article media upload endpoint (`POST /api/v1/articles/upload-media`) integrating with Cloudinary.
- RBAC security restricting access to authenticated Blood Center Staff and Admins.
- Comprehensive audit logging for creation, status toggles, edits, and deletions.

### Out of Scope
- Future-dated publishing / scheduling background jobs (`Scheduled` state removed).
- Infinite scrolling or "load-more" pagination patterns (replaced strictly by numbered pagination).
- Donor-facing news feed display logic (handled under `NF-UC-01` and `NF-UC-02`).
- Hospital or external portal article rendering endpoints.
- Content recommendation algorithms or AI text generation.

---

## 3. User Scenarios & User Stories

### User Story 1 - Create and Publish Urgent Alert / News (Priority: P1)
**As a** Blood Center Staff member (e.g., Dr. Sarah Chen),  
**I want to** quickly draft and publish an article or urgent blood shortage alert targeted at Donors and Hospitals,  
**So that** the target audiences are immediately notified and updated.

**Why this priority**: Creating and publishing articles is the fundamental entry point for content management and emergency alert dissemination.

**Independent Test**: Can be tested by navigating to the Create Article screen, filling out required fields, choosing "Published", and verifying the article becomes visible and searchable.

**Acceptance Scenarios**:
1. **Given** Staff is on the Create Article form, **When** they fill in title, content, select category "Alert", select target audience "Donors", and click "Save Article" with Published enabled, **Then** the system creates the article, sets status to `Published`, and displays a success notification.
2. **Given** Staff leaves the Title field empty and attempts to save, **When** validation runs, **Then** the system prevents submission and displays "Title is required".

---

### User Story 2 - Save and Auto-Save Draft (Priority: P2)
**As a** Blood Center Staff member,  
**I want to** save incomplete articles as Drafts and have the system periodically auto-save my work,  
**So that** work in progress is preserved without risk of data loss.

**Why this priority**: Prevents lost progress while compiling lengthy educational content or complex news announcements.

**Independent Test**: Test by entering a title and body text, keeping the status toggle set to Draft, and confirming auto-save triggers after 30 seconds of inactivity.

**Acceptance Scenarios**:
1. **Given** Staff enters title and body text on the Create form, **When** Staff leaves status as Draft and pauses typing for 30 seconds, **Then** the system auto-saves the draft and updates the indicator to "Auto-saved just now".

---

### User Story 3 - View, Filter, Edit, and Unpublish Articles (Priority: P1)
**As a** Blood Center Staff member,  
**I want to** view a paginated list of all existing articles, inspect dashboard statistics, edit content, and toggle status between Published and Draft,  
**So that** outdated or inaccurate articles can be updated or immediately hidden from public listing.

**Why this priority**: Content maintenance and instant unpublishing are critical for data accuracy and risk management.

**Independent Test**: Edit a published article, switch the toggle to Draft, save, and confirm that status changes to `Draft` and is removed from public feed listings.

**Acceptance Scenarios**:
1. **Given** an article with status `Published`, **When** Staff opens the Edit form, changes the status toggle to `Draft`, and saves, **Then** the article status becomes `Draft` immediately and it is removed from public feed listings and Active Alerts counters.

---

### User Story 4 - Delete Article with Confirmation (Priority: P2)
> *Note: Delete functionality is an extension beyond the original UseCaseSpec.md (BC-UC-09 only describes View/Edit), added per stakeholder request and confirmed via UI mockup review.*

**As a** Blood Center Staff member,  
**I want to** delete obsolete or duplicate articles after reviewing a confirmation prompt,  
**So that** the content system remains clean and dashboard metrics accurately reflect active content.

**Why this priority**: Deletion prevents clutter and ensures dashboard stats (Total Articles, Active Alerts) are accurate.

**Independent Test**: Select Delete from an article card menu, confirm in the modal, and verify the card disappears and dashboard statistics update immediately.

**Acceptance Scenarios**:
1. **Given** an article card in the Article List, **When** Staff selects Delete from the `⋮` menu and confirms in the dialog, **Then** the article is soft-deleted, removed from the list view, and total stats update.

---

### Edge Cases
- **Simultaneous Deletion & Edit**: Staff attempts to edit or save an article that was deleted by another user in another session → System detects missing record, returns `404 Not Found`, displays error message, and redirects to Article List.
- **Unpublishing Active Alerts**: Staff unpublishes a `Published` "Alert" article → Dashboard counter "Active Alerts" immediately decreases by 1.
- **Auto-save during disconnect**: Network loss occurs during auto-save → Auto-save fails gracefully without blocking the UI, showing "Offline - draft saved locally".
- **Last Item Deletion on Page**: Deleting the final article on page N (when page N becomes empty) → System automatically redirects navigation to page N-1 (last valid page).

---

## 4. Functional Requirements

### BC-UC-08: Create and Publish Article Requirements
- **FR-001**: System MUST provide an Article Creation Form containing the following fields:
  - `Title`: text input (required).
  - `Article Content`: rich text / plain text editor area.
  - `Category`: single-select dropdown with options `News`, `Alert`, `Educational`.
  - `Status & Visibility`: binary toggle switch between `Draft` and `Published`.
  - `Target Audience`: multi-select checkboxes for `Donors`, `Staff`, `Hospitals`.
  - `Featured Media`: image drag-and-drop / click file upload area.
- **FR-002**: System MUST display visual inline validation errors. If `Title` is empty, system MUST display `"Title is required"`.
- **FR-003**: System MUST require at least one `Target Audience` selection prior to saving an article in `Published` status. Target audience is optional for `Draft` status.
- **FR-004**: If `Published` is selected, system MUST publish the article immediately upon clicking "Save Article" (status: `Published`).
- **FR-005**: System MUST periodically auto-save articles while they are in `Draft` status (default interval: every 30 seconds of inactivity or changes) and display the auto-save status timestamp (e.g., `"Auto-saved X minutes ago"`). Auto-save MUST NOT apply to `Published` articles.
- **FR-006**: System MUST display an **Editor Tip** box inside the editor sidebar (e.g., *"High-quality images and clear calls-to-action increase audience engagement by up to 40%"*).
- **FR-007**: System MUST provide action buttons:
  - `Cancel`: prompts confirmation if unsaved changes exist, discards changes, and returns to the Article List.
  - `Save Article`: validates inputs and persists the article.

### Featured Media Upload (Article-only extension)
> *Note: This upload endpoint is scoped exclusively to Article Management. Campaign management does not currently have an equivalent endpoint and is out of scope for this addition.*

- **FR-017**: System MUST provide an image upload endpoint `POST /api/v1/articles/upload-media` dedicated to Article Management, accepting `multipart/form-data` with a field named `file`.
- **FR-018**: System MUST validate uploaded files: only `image/png`, `image/jpeg`, `image/jpg` MIME types allowed; max file size 5MB (per existing BR-007).
- **FR-019**: System MUST upload valid images to Cloudinary under the folder `lifeline/articles`, and return `{ "url": "<secure_url>" }` in the response.
- **FR-020**: The returned `url` MUST be usable directly as the value for the `featuredMediaUrl` field when creating/editing an article.

### BC-UC-09: View/Edit/Delete Article Requirements
> *Note: Delete functionality (FR-014, FR-015, FR-016) is an extension beyond the original UseCaseSpec.md (BC-UC-09 only describes View/Edit), added per stakeholder request and confirmed via UI mockup review.*

- **FR-008**: System MUST render the **Article List / Content Management Screen** with a top header breadcrumb `Content Management / Article List` and a `"Create Article"` primary action button navigating to `BC-UC-08`.
  - System MUST paginate the article list at **12 articles per page**.
  - System MUST display pagination controls below the article grid: numbered page buttons, Previous/Next navigation, and current page indicator.
  - System MUST preserve any active filters (category, status) when navigating between pages.
  - If the total result count changes (e.g., after a delete) such that the current page no longer exists (e.g., deleting the last item on the last page), system MUST redirect to the last valid page.
- **FR-009**: System MUST display a **Dashboard Summary Header** featuring three real-time stat widgets:
  1. `Total Articles`: total count of non-deleted articles (Draft, Published).
  2. `Public Reach`: cumulative sum of article views / audience reach (e.g., `4.2k`).
  3. `Active Alerts`: count of articles where `category = Alert` AND `status = Published`.
- **FR-010**: System MUST display articles as responsive cards containing:
  - Color-coded Category Badge (`News` = Blue, `Alert` = Red, `Educational` = Green/Teal).
  - Title.
  - Author Name + creation timestamp (e.g., `"Dr. Sarah Chen • Oct 24, 2023"` or `"System • 2h ago"`).
  - Color-coded Status Badge (`Published` = Green pill, `Draft` = Gray pill). *Note: UI frontend may display a visual "Live" badge label when `category = Alert` AND `status = Published`.*
  - View Count indicator with a chart icon.
  - Quick action three-dot menu (`⋮`) containing `Edit` and `Delete` options.
- **FR-011**: Selecting `Edit` from the card menu or clicking the card MUST open the article form pre-filled with existing record data.
- **FR-012**: Saving changes on an existing article MUST update the record in place without creating a duplicate entity.
- **FR-013**: System MUST allow direct status toggling on the Edit form (`Draft` ↔ `Published`) without requiring a separate approval step:
  - Toggling from `Published` to `Draft` and saving MUST immediately unpublish the article, set status to `Draft`, hide it from public feed APIs, and remove it from active listings and counters.
  - Toggling from `Draft` to `Published` and saving MUST immediately publish the article (status: `Published`).
- **FR-014**: Selecting `Delete` from the card menu MUST trigger a modal confirmation dialog: `"Are you sure you want to delete this article? This action cannot be undone."` with actions `Cancel` and `Confirm Delete`.
- **FR-015**: Upon confirming deletion, system MUST soft-delete the article (`deletedAt` set), remove the card from the UI, and update all dashboard stats (`Total Articles`, `Active Alerts`) immediately.
- **FR-016**: Canceling deletion MUST close the modal without altering any data.

---

## 5. Key Entities & Data Model

The feature reuses and extends the authoritative `Article` collection schema defined in `DatabaseSchema.md` (§2.13):

### Entity: `Article` (Collection: `articles`)

| Field Name | Data Type | Validation / Constraints | Description / Notes |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Auto-generated document ID. |
| `authorStaffId` | ObjectId | Required, FK → `StaffProfile` | ID of the staff member creating/editing the article. |
| `authorName` | String | Optional / Populated | Display name of the author (e.g., `"Dr. Sarah Chen"`). |
| `title` | String | Required, non-empty, max 200 chars | Article headline. |
| `bodyContent` | String | Required for Published, rich/plain text | Main content text of the article. |
| `category` | Enum | Enum: `News`, `Alert`, `Educational` | Categorization of content. |
| `status` | Enum | Enum: `Draft`, `Published` | Lifecycle state of article (2 states only per UseCaseSpec.md). |
| `targetAudience` | Array\<Enum\> | Array elements: `Donors`, `Staff`, `Hospitals` | Target audiences for distribution. |
| `featuredMediaUrl` | String | Optional, valid URL (Cloudinary) | Uploaded media image URL. |
| `viewCount` | Integer | Non-negative integer, default `0` | Number of times article has been viewed. |
| `reachCount` | Integer | Non-negative integer, default `0` | Total audience reach metric. |
| `createdAt` | Date | ISO Timestamp | Creation timestamp. |
| `updatedAt` | Date | ISO Timestamp | Last modification timestamp. |
| `deletedAt` | Date \| null | Optional ISO Timestamp | Soft deletion timestamp (`null` if active). |

---

## 6. Business Rules & Validation Rules

- **BR-001 (Title Mandatory)**: An article cannot be saved without a title. Empty title produces `"Title is required"`.
- **BR-002 (Target Audience for Publishing)**: At least one `targetAudience` option (`Donors`, `Staff`, `Hospitals`) MUST be selected when saving with status `Published`.
- **BR-003 (Status Model - 2 States Only)**:
  - If status toggle = `Published` → status becomes `Published` immediately.
  - If status toggle = `Draft` → status becomes `Draft`.
- **BR-004 (Auto-Save Eligibility)**: Auto-save timer executes ONLY when status is `Draft`. Saved changes in `Draft` do not trigger audit alerts or public feed notifications.
- **BR-005 (Direct Unpublishing)**: Staff can switch any `Published` article back to `Draft` state at any time. Unpublishing takes effect immediately upon saving without requiring administrative re-approval.
- **BR-006 (Soft Deletion)**: Deletion sets `deletedAt = new Date()`. Soft-deleted articles are excluded from standard API list queries and dashboard metric recalculations.
- **BR-007 (Image Constraints)**: Uploaded featured media must be image format (`image/png`, `image/jpeg`, `image/jpg`), max file size 5MB. Recommended resolution is 1200x630px.

---

## 7. User Interface & Screen Specifications

### 1. Article List & Dashboard Screen (`/content/articles`)
- **Breadcrumb**: `Content Management` / `Article List`
- **Header Action**: Blue primary button `+ Create Article` (top-right).
- **Stat Cards**:
  - `Total Articles`: Card showing icon + integer count (e.g. `24`).
  - `Public Reach`: Card showing chart icon + reach number (e.g. `4.2k`).
  - `Active Alerts`: Card showing alert bell icon + count of Published Alert articles (e.g. `3`).
- **Grid / List View**: Responsive cards displaying:
  - Media thumbnail preview.
  - Badge tag: `News` (Blue), `Alert` (Red), `Educational` (Teal).
  - Title text.
  - Author and relative timestamp (`"Dr. Sarah Chen • 2 hours ago"`).
  - Status indicator: `Published` (Green pill), `Draft` (Gray pill). *(UI frontend may visually render a "Live" badge for Published Alerts).*
  - Metrics: View count (`1,240 views`).
  - Actions menu (`⋮`): Dropdown with `Edit Article` and `Delete Article`.
- **Pagination Bar**: Numbered page controls (e.g. `< 1 2 3 ... 11 >`) centered below the article grid, showing 12 articles per page.

### 2. Create / Edit Article Screen (`/content/articles/new` or `/content/articles/:id/edit`)
- **Header**: `Create Article` or `Edit Article: <Title>` with `Back to List` link.
- **Main Column**:
  - `Title` input field with placeholder `"Enter article title..."`.
  - `Content Editor`: Toolbar (Bold, Italic, Lists, Links) + text area.
  - `Featured Media Upload`: Drag-and-drop box with prompt *"Click or drag image to upload (Recommended 1200x630px, PNG/JPG up to 5MB)"*.
- **Sidebar Column**:
  - `Category`: Dropdown (`News`, `Alert`, `Educational`).
  - `Target Audience`: Checkboxes `[ ] Donors  [ ] Staff  [ ] Hospitals`.
  - `Status & Visibility`: Toggle switch (`Draft` ↔ `Published`).
  - `Editor Tip Box`: Styled info box with light bulb icon.
  - `Auto-save Status`: Text at bottom of sidebar (e.g. `"Auto-saved 2 minutes ago"`).
  - `Action Bar`: `Cancel` button (neutral) and `Save Article` button (primary blue/green).

---

## 8. Acceptance Criteria

### Scenario 1: Create Article Success (Immediate Publish)
- **Given** Staff is on `/content/articles/new`,
- **When** Staff enters title `"Emergency O- Blood Shortage"`, content, category `"Alert"`, selects audience `"Donors"` & `"Hospitals"`, sets toggle to `Published`, and clicks `Save Article`,
- **Then** API persists article with status `Published`, returns `201 Created`, displays toast `"Article published successfully!"`, and redirects to Article List.

### Scenario 2: Create Article Success (Draft & Auto-Save)
- **Given** Staff enters title `"Tips for First Time Donors"` and content,
- **When** Staff leaves toggle set to `Draft` and stops typing for 30 seconds,
- **Then** System automatically persists draft payload via auto-save API and updates text to `"Auto-saved just now"`.

### Scenario 3: Missing Required Title Validation
- **Given** Staff leaves Title blank and selects audience `"Donors"`,
- **When** Staff clicks `Save Article`,
- **Then** System prevents API submission, scrolls to Title field, highlights input in red, and displays error `"Title is required"`.

### Scenario 4: Missing Target Audience on Publish Validation
- **Given** Staff enters valid Title and content, sets toggle to `Published`, but unchecks all Target Audience options,
- **When** Staff clicks `Save Article`,
- **Then** System displays validation alert `"At least one target audience must be selected before publishing."`

### Scenario 5: Edit Article and Unpublish
- **Given** Staff clicks `Edit` on a `Published` article card,
- **When** Staff changes status toggle from `Published` to `Draft` and clicks `Save Article`,
- **Then** System updates record status to `Draft`, displays `"Article unpublished and saved as Draft"`, removes article from public news feed, and decrements `Active Alerts` stat if category was `Alert`.

### Scenario 6: Delete Article Confirmation & Stat Update
- **Given** Staff clicks `Delete` on an article card in the list,
- **When** Confirmation modal appears and Staff clicks `Confirm Delete`,
- **Then** System sends soft-delete request (`DELETE /api/v1/articles/:id`), removes card from list, displays `"Article deleted"`, and recalculates `Total Articles` and `Active Alerts` stats immediately.

### Scenario 7: Attempting to Edit Deleted Article
- **Given** An article was deleted by another user,
- **When** Staff attempts to open edit route `/content/articles/:id/edit`,
- **Then** API returns `404 Not Found`, UI displays toast `"Article not found or has been deleted"`, and redirects to `/content/articles`.

### Scenario 8: Article List Pagination
- **Given** there are more than 12 articles in the system,
- **When** Staff loads `/content/articles`,
- **Then** the system displays the first 12 articles and pagination controls; clicking page 2 loads the next 12 articles via `GET /api/v1/articles?page=2&limit=12` without a full page reload.

### Scenario 9: Upload Featured Media Image
- **Given** Staff is creating or editing an article,
- **When** Staff uploads a valid PNG/JPG image under 5MB via `POST /api/v1/articles/upload-media`,
- **Then** the system returns `201 Created` with a Cloudinary `url`, which Staff can then submit as `featuredMediaUrl` in the article payload.

### Scenario 10: Reject Invalid File
- **Given** Staff attempts to upload a file that is not PNG/JPG, or exceeds 5MB,
- **When** Staff calls `POST /api/v1/articles/upload-media`,
- **Then** the system returns `400 Bad Request` with a clear validation message.

---

## 9. Non-Functional Requirements

- **NFR-001 (Security & RBAC)**: Article creation, updating, unpublishing, and deletion endpoints MUST require authenticated user context with `Blood Center Staff` or `Admin` role.
- **NFR-002 (Performance)**:
  - Article list query with pagination (default `limit=12`) MUST return in under `500ms`.
  - Article details load for editing MUST complete within `300ms`.
  - Image upload processing MUST enforce strict 5MB limits and complete upload within `3s` on standard connections.
- **NFR-003 (Usability)**:
  - Category badges and status pills MUST be color-coded for fast visual identification.
  - Delete action MUST always require confirmation modal to prevent accidental loss.
- **NFR-004 (Auditability)**: All status transitions (Draft → Published, Published → Draft) and deletions MUST generate an audit log entry referencing staff user ID, article ID, action type, and timestamp.
- **NFR-005 (Standards Compliance)**: Datetime values MUST adhere to ISO 8601 standards.

---

## 10. Authorization & Access Control

| Endpoint / Action | Allowed Roles | Description / Restrictions |
| :--- | :--- | :--- |
| `POST /api/v1/articles` | `Staff`, `Admin` | Create new article. Requires `content-management:create` permission. |
| `GET /api/v1/articles` | `Staff`, `Admin` | List all internal articles (including Drafts). Accepts `page` and `limit` query parameters. |
| `GET /api/v1/articles/:id` | `Staff`, `Admin` | Fetch single article detail for editing. |
| `PATCH /api/v1/articles/:id` | `Staff`, `Admin` | Update existing article / toggle status. Staff can edit all articles. |
| `DELETE /api/v1/articles/:id` | `Staff`, `Admin` | Soft-delete article. Requires staff/admin privileges. |
| `POST /api/v1/articles/upload-media` | `Staff`, `Admin` | Uploads featured media image for articles. Requires `content-management:create` permission. |

---

## 11. Audit Logging & Compliance

Every write operation MUST emit a structured audit log entry:
- **Event Types**: `ARTICLE_CREATED`, `ARTICLE_UPDATED`, `ARTICLE_UNPUBLISHED`, `ARTICLE_DELETED`. *(Note: `ARTICLE_SCHEDULED` removed as scheduling logic is out of scope).*
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "ARTICLE_UNPUBLISHED",
    "actorId": "staff_64f1a...",
    "articleId": "art_98b2c...",
    "timestamp": "2026-07-21T08:58:45Z",
    "changes": {
      "previousStatus": "Published",
      "newStatus": "Draft"
    }
  }
  ```

---

## 12. Success Criteria

- **SC-001**: Staff can create, draft, and publish an article in under 2 minutes.
- **SC-002**: Toggling an article status from Published to Draft removes it from public availability instantly (0 lag).
- **SC-003**: 100% of missing required inputs trigger explicit, helpful validation messages.
- **SC-004**: Deletion of articles immediately updates Dashboard stat widgets without full page reload.

---

## 13. Assumptions

- File uploads are stored via Cloudinary or S3-compatible service returning a public CDN URL.
- Donor-facing frontend consumes a separate public endpoint (`GET /api/v1/public/articles`) filtering out `Draft` status and non-Donor targeted items.
- Article featured media upload uses Cloudinary directly via a dedicated Article-scoped endpoint; this is not a shared/generic media service.

---

## 14. Traceability

- **BC-UC-08**: Create and Publish Article
- **BC-UC-09**: View/Edit/Delete Article
- **Stakeholder Specs**: SystemArchitecture.md (`content-news` module), DatabaseSchema.md (§2.13 `Article`), UseCaseSpec.md (§BC-UC-08, §BC-UC-09).
