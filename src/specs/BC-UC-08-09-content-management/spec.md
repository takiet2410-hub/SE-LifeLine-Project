# Feature Specification: Article Management (BC-UC-08, BC-UC-09, Delete Article)

**Feature Path**: `specs/BC-UC-08-09-content-management`

**Created**: 2026-07-28

**Status**: Approved (Replaces & Supersedes Prior Spec)

**Scope**: End-to-end specification for Content Management module covering Article Creation (BC-UC-08), View/Edit Article (BC-UC-09), and Delete Article (new capability), including both Frontend UI behaviors and Backend REST API & Data Model requirements.

---

## User Scenarios & Acceptance Criteria

### User Story 1 - Create Article (BC-UC-08) (Priority: P1)

As an authenticated Blood Center Staff member, I want to create, auto-save drafts, and publish articles (news, educational content, campaign alerts) with rich text, featured media, category, publishing schedule, and targeted audiences so that relevant information is effectively communicated to donors, staff, or hospitals.

**Why this priority**: Content creation is the core entry point for communicating blood donation campaigns, health education, and urgent alerts across the LifeLine system.

**Independent Test**: Staff clicks "Create Article", fills required fields (Title, Body, Category, Media, Schedule, Target Audience), toggle Draft/Published, verify auto-save timestamp, save, and confirm article appears in the content list and dashboard metrics.

**Acceptance Scenarios**:

1. **Successful Immediate Publish**:
   - **Given** Staff is on the "Create Article" form,
   - **When** Staff enters a valid title, rich text body, selects category (e.g., News, Alert, Educational), uploads a featured image (1200x630px, PNG/JPG), selects target audience checkboxes (Donors, Staff, Hospitals), leaves publishing schedule empty, sets status toggle to **Published**, and clicks **Save Article**,
   - **Then** the system validates all required fields, persists and publishes the article immediately, displays a success notification ("Article published successfully"), and redirects to the updated article list displaying the new article as **Published**.

2. **Successful Scheduled Publish**:
   - **Given** Staff is creating an article and selects a future date and time in the Publishing Schedule pickers,
   - **When** Staff sets status to **Published** and clicks **Save Article**,
   - **Then** the system saves the article with a scheduled publish status, publishes it automatically when the scheduled date/time arrives, and displays a success notification ("Article scheduled for publication on [Date Time]").

3. **Save as Draft & Autosave**:
   - **Given** Staff is filling the article form,
   - **When** Staff pauses editing or clicks **Save Article** with status set to **Draft**,
   - **Then** the system periodically auto-saves the draft (updating the bottom indicator "Auto-saved X minutes ago"), and saving persists the draft without publishing it to public channels.

4. **Validation Failures**:
   - **Given** Staff attempts to save a Published article with an empty title or body,
   - **When** Staff clicks **Save Article**,
   - **Then** the system prevents submission, highlights the missing required fields inline with error messages ("Title is required"), and retains all entered form data.

5. **Cancel Flow with Unsaved Changes**:
   - **Given** Staff has un-saved changes on the Create form and clicks **Cancel**,
   - **When** the cancel button is clicked,
   - **Then** the system opens a confirmation dialog offering "Continue Editing" or "Discard Changes". Selecting "Discard Changes" abandons changes and returns to the article list.

---

### User Story 2 - View & Edit Article (BC-UC-09) (Priority: P1)

As an authenticated Blood Center Staff member, I want to view full article details—including performance analytics and engagement insights—and inline-edit all article attributes so that I can maintain accurate, engaging content over time.

**Why this priority**: Content maintenance and performance review allow staff to optimize outreach campaigns and correct information quickly.

**Independent Test**: Staff selects an article from the list, inspects the performance panel (Total Views, Public Reach, Shares) and engagement note, clicks "Edit Article", modifies fields, saves, and verifies updated content is reflected in detail view and list view.

**Acceptance Scenarios**:

1. **Viewing Article Detail & Performance Panel**:
   - **Given** Staff selects an article card from the Content Management dashboard,
   - **When** the detail page loads,
   - **Then** the system renders category tag, status tag (Draft/Published/Scheduled), title, author, publish date, estimated read time, cover image, full rich-text body, a **Performance** panel (Total Views, Public Reach, Shares), and an **Engagement Note** insight (e.g., "This article has 24% more engagement than the average post this month").

2. **Inline Edit & Save**:
   - **Given** Staff clicks **Edit Article** in the Quick Actions panel,
   - **When** the page enables editable form fields (title, category, content, media, status, schedule, target audience) and Staff submits valid changes via **Save**,
   - **Then** the system validates, persists changes atomically, displays a success notification ("Article updated successfully"), and returns to the updated detail view.

3. **Edit Cancelation**:
   - **Given** Staff makes changes in Edit mode and clicks **Cancel**,
   - **When** Staff confirms "Discard Changes" in the confirmation dialog,
   - **Then** the system restores the original article data and exits edit mode.

4. **Article Not Found Edge Case**:
   - **Given** Staff attempts to access or edit an article ID that does not exist or has been deleted,
   - **When** the page requests article data,
   - **Then** the system displays an error banner ("Article not found") and redirects to the article list.

---

### User Story 3 - Delete Article (Priority: P2)

As an authenticated Blood Center Staff member, I want to permanently delete draft or published articles with explicit confirmation so that obsolete or erroneous content is safely removed from public views and system metrics.

**Why this priority**: Removing outdated or incorrect articles is vital for compliance, data hygiene, and preventing public misinformation.

**Independent Test**: Click "Delete" on an article card menu or from the detail page Quick Actions panel, confirm deletion modal, verify immediate removal from public feeds, list view, and updated dashboard metrics (Total Articles count decreases).

**Acceptance Scenarios**:

1. **Deleting an Article from List or Detail View**:
   - **Given** Staff clicks the **Delete** action (via the 3-dot card menu in list view or Quick Actions panel in detail view),
   - **When** the confirmation modal appears ("Are you sure you want to delete this article? This action cannot be undone.") and Staff clicks **Confirm Delete**,
   - **Then** the system validates staff permissions, permanently removes the article (un-publishing it immediately if Published so it becomes inaccessible to end users), updates dashboard stats (Total Articles count decreases), displays a success toast ("Article deleted successfully"), and redirects to the article list.

2. **Cancel Deletion**:
   - **Given** Staff clicks **Delete** and the confirmation dialog appears,
   - **When** Staff clicks **Cancel**,
   - **Then** the dialog closes and no data is modified.

3. **Already-Deleted Edge Case**:
   - **Given** Staff attempts to delete an article that has already been deleted by another user,
   - **When** Staff confirms deletion,
   - **Then** the system displays an error message ("Article not found or already deleted") and refreshes the article list view.

---

## Functional Requirements

### 1. Article Data & Taxonomy
- **Fields**: Article Title (string, max 200 chars, required), Body Content (rich-text HTML string, required for Published), Category (dropdown: `News`, `Alert`, `Educational`, `Campaign`), Status (`Draft`, `Published`, `Scheduled`), Cover Image URL (PNG/JPG, max 5MB), Publishing Schedule (optional datetime), Target Audience (multi-select: `Donors`, `Staff`, `Hospitals`), Estimated Read Time (calculated automatically based on word count).
- **Default Audience**: If none selected, defaults to `Donors`.
- **Default Status**: New articles default to `Draft` unless `Published` is explicitly toggled.

### 2. Auto-Save Mechanism
- While editing on Create or Edit screens, the system auto-saves draft changes every 60 seconds or after 3 seconds of idle typing.
- The UI MUST display an autosave timestamp indicator (e.g., "Auto-saved X minutes ago" / "Draft saved just now").

### 3. Analytics & Performance Tracking
- System MUST track Total Views, Public Reach (unique viewer count), Shares, and compute monthly engagement comparison notes.
- Performance metrics MUST be displayed in the Performance Panel on the Article Detail view.

### 4. Delete & Un-publish Rules
- Deleting a Published article MUST immediately un-publish it and return HTTP 404 / unavailable for public donor/hospital endpoints.
- Deletion MUST recalculate dashboard summary metrics (Total Articles, Active Alerts, Public Reach).

---

## Non-Functional Requirements

- **Security & Authorization**: Only users with role `BloodCenterStaff` or `Administrator` can create, edit, or delete articles. All mutation operations (Create, Edit, Delete) MUST generate an immutable audit log recording `actorUserId`, `action`, `articleId`, `timestamp`, and `ipAddress`.
- **Performance**:
  - Save/Publish/Delete API responses MUST complete within 3 seconds.
  - Article Detail page load MUST render within 3 seconds.
- **Usability**: Required fields clearly indicated with red asterisks. Rich-text editor supporting bold, italic, lists, headings, links, and media embeds. Destructive actions (Delete, Discard) require modal confirmation.

---

## Technical Specifications (Backend & Frontend Architecture)

### 1. Data Model (`Article` Mongoose Schema)
```typescript
interface IArticle extends Document {
  title: string;
  bodyContent: string;
  category: 'News' | 'Alert' | 'Educational' | 'Campaign';
  status: 'Draft' | 'Published' | 'Scheduled';
  coverImageUrl?: string;
  publishedAt?: Date;
  scheduledAt?: Date;
  targetAudience: ('Donors' | 'Staff' | 'Hospitals')[];
  authorStaffId: mongoose.Types.ObjectId;
  viewsCount: number;
  publicReachCount: number;
  sharesCount: number;
  readTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. REST API Endpoints
- `GET /api/v1/bc/articles`: Paginated list of articles (supports query params: `page`, `limit`, `category`, `status`, `search`).
- `POST /api/v1/bc/articles`: Create a new article (Draft or Published).
- `GET /api/v1/bc/articles/:articleId`: Get full article details with performance analytics.
- `PUT /api/v1/bc/articles/:articleId`: Update existing article fields.
- `DELETE /api/v1/bc/articles/:articleId`: Delete article & clean up public index.
- `GET /api/v1/bc/articles/stats/summary`: Get Content Management dashboard summary metrics.

---

## Success Criteria

1. **Task Completion**: Staff can create, edit, schedule, and delete articles without technical errors in 100% of tested valid flows.
2. **Data Consistency**: Deleting an article immediately updates dashboard counters and removes the item from all donor/public views within 1 second.
3. **Safety & Audit**: 100% of creation, edit, and deletion actions leave audit trail logs with staff identity and timestamp.
