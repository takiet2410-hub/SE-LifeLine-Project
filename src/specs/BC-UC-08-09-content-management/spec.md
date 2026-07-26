# Spec: BC-UC-08 → BC-UC-09 — Content Management (Frontend)

> **Spec-Kit Artifact** | **Covers**: BC-UC-08 (Create & Publish Article), BC-UC-09 (View/Edit Article)
> **Actor**: Blood Center Staff
> **Module**: `src/frontend/src/modules/content-mgmt/`
> **Figma Section**: "Blood Center" → Content Management screens (rows 8–9 of reference.png)

---

## 1. Figma Reference & Design Token Mapping

- **Figma File**: `https://www.figma.com/design/BkMtRpqqIa0J680q1DukPt/Untitled?node-id=1-29566`
- **Reference Image**: `docs/analysis-and-design/ui-design/bc-frontend-assets/reference.png`
- **Design tokens**: Same as Campaign Management spec (shared LifeLine Blood Center theme)

### 1.1 Screens Identified from Figma

| Screen ID | Name | Figma Position | Maps to UC |
| :--- | :--- | :--- | :--- |
| ART-LIST | Article List (card/table view) | Row 8, Col 1 | BC-UC-09 (list) |
| ART-CREATE | Create Article (rich-text form) | Row 8, Col 2-3 | BC-UC-08 |
| ART-DETAIL-VIEW | Article Detail (read view) | Row 9, Col 1 | BC-UC-09 (view) |
| ART-DETAIL-EDIT | Article Detail (edit mode) | Row 8, Col 3-4 | BC-UC-09 (edit) |
| ART-CONFIRM-DIALOG | Discard/Cancel Confirmation | Reused component | BC-UC-08/09 cancel flows |

---

## 2. Screen-by-Screen Functional Requirements

### 2.1 ART-LIST — Article List Page (BC-UC-09 entry point)

**Purpose**: Display all articles with status, allowing staff to manage content.

**UI Elements**:
- Page title: "Content Management"
- **"Create Article" button** (red, top-right) → navigates to ART-CREATE
- **Article cards or table** showing:
  - Thumbnail image
  - Article Title
  - Category
  - Status badge (Draft=gray, Published=green, Unpublished=amber)
  - Published Date
  - Author Name
  - Actions: View/Edit
- **Filter controls**: by status (Draft/Published/Unpublished), by category
- **Pagination**
- **Empty State**: "No articles yet. Create your first article!" (when list empty)

**Data Binding** (from `DatabaseSchema.md → ARTICLE`):
```typescript
interface Article {
  _id: string;
  authorStaffId: string;
  title: string;
  bodyContent: string;           // Rich text / HTML content
  imageUrls: string[];           // Cloudinary URLs
  status: 'Draft' | 'Published' | 'Unpublished';
  publishedAt: string | null;    // ISO 8601
  createdAt: string;
}
```

**API Endpoint**: `GET /api/v1/bc/articles` (paginated, filterable)

---

### 2.2 ART-CREATE — Create & Publish Article (BC-UC-08)

**Purpose**: Rich-text article creation with image upload and Draft/Publish options.

**UI Elements**:
- Page title: "Create New Article"
- Form fields:
  - Title (text input, required)
  - Category (dropdown: News, Education, Campaign Announcement, etc.)
  - Thumbnail Image (file upload with preview, Cloudinary)
  - Content (rich-text editor — e.g., TipTap, Quill, or TinyMCE)
- **Status toggle**: Draft or Published
- **"Save Article" button** (red, primary)
- **"Cancel" button** (gray) → confirmation dialog (AF-03)

**Form Rules** (from `UseCaseSpec.md BC-UC-08`):
- Title: required, string
- Category: required, from predefined list
- Content: required (must have non-empty body)
- When status = "Published" → all fields required
- When status = "Draft" → title required, others optional
- Missing fields → inline error highlighting (AF-01)
- Publishing failure → error toast, retain form data (AF-04)

**API Endpoints**:
- `POST /api/v1/bc/articles` (body includes status: 'Draft' | 'Published')
- File upload: `POST /api/v1/bc/upload` (Multer → Cloudinary, returns URL)

---

### 2.3 ART-DETAIL — Article View/Edit (BC-UC-09)

**Purpose**: View an article's full content and optionally edit it.

**UI Elements (View Mode)**:
- Breadcrumb: Content Management > [Article Title]
- Article header: Title, Category badge, Status badge, Published date, Author
- Article body: rendered rich-text content
- Thumbnail/images displayed
- **"Edit" button** → switches to edit mode
- **"Delete" button** (if applicable, not in UC-09 spec but may be needed)

**UI Elements (Edit Mode)**:
- Same form as Create, pre-filled with current content
- Rich-text editor with existing content loaded
- **"Save" button** + **"Cancel" button** (with discard confirmation)
- Change status: Draft ↔ Published ↔ Unpublished

**States**:
- **Loading**: Skeleton for article content
- **Not Found**: Error state with "Article not found" (AF-01)
- **Update Success**: Toast "Article updated successfully"
- **Update Failure**: Error toast (AF-03)

**API Endpoints**:
- `GET /api/v1/bc/articles/:articleId`
- `PUT /api/v1/bc/articles/:articleId`

#### 2.3.1 🛡 Article Edit Cancel & Unsaved Changes Guard (BC-UC-09 AF-02) — DETAILED

> **Requirement Source**: `BC-UC-09 AF-02` — "Staff clicks the Cancel button before saving changes → System discards all unsaved modifications → System displays the original article content"
> **Status**: ✅ Fully specified below (supplements Figma which lacks explicit cancel dialog for article editing)

**Cancel Flow (Step-by-Step)**:

```
Staff is editing article
        │
        ├──── Clicks "Cancel" button
        │           │
        │           ▼
        │   ┌─────────────────────────────────────────┐
        │   │  Discard Changes?                        │
        │   │  ─────────────────────────────────────── │
        │   │  You have unsaved changes to this        │
        │   │  article. What would you like to do?     │
        │   │                                          │
        │   │  [Continue Editing]    [Discard Changes]  │
        │   └─────────────────────────────────────────┘
        │           │                    │
        │           ▼                    ▼
        │   Return to edit mode    Discard all changes
        │                          Restore original content
        │                          Switch to View Mode
        │
        ├──── Clicks browser back button / navigates away
        │           │
        │           ▼
        │   Same confirmation dialog appears
        │   (Route navigation blocked until confirmed)
        │
        └──── Presses Escape key
                    │
                    ▼
            Same confirmation dialog appears
```

**Unsaved Changes Detection**:
```typescript
// Hook: useUnsavedChanges(isDirty: boolean)
// - Uses react-router-dom `useBlocker` to intercept navigation
// - Uses `beforeunload` event to catch browser close/refresh
// - `isDirty` from react-hook-form's `formState.isDirty`

const useUnsavedChanges = (isDirty: boolean) => {
  // 1. Block route navigation
  const blocker = useBlocker(isDirty);

  // 2. Block browser close/refresh
  useEffect(() => {
    if (isDirty) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [isDirty]);

  return { blocker, showDialog: blocker.state === 'blocked' };
};
```

**Confirmation Dialog Component** (reuse `ConfirmDiscardDialog.tsx`):
```
Tailwind classes:
  overlay:         fixed inset-0 bg-black/50 z-50 flex items-center justify-center
  dialog:          bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6
  title:           text-lg font-semibold text-slate-900
  message:         text-sm text-slate-600 mt-2
  button-group:    flex gap-3 mt-6 justify-end
  continue-btn:    bg-white border border-slate-300 text-slate-700 px-4 py-2
                   rounded-lg hover:bg-slate-50
  discard-btn:     bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700
```

**Triggers for Confirmation Dialog**:
1. ✅ Click "Cancel" button in edit form
2. ✅ Click browser back button (via `useBlocker`)
3. ✅ Press `Escape` key (via `onKeyDown` handler)
4. ✅ Click sidebar navigation item while editing (via `useBlocker`)
5. ✅ Close browser tab/window (via `beforeunload` — browser-native dialog)

**"Discard Changes" behavior**:
- Reset form to original values: `form.reset(originalArticleData)`
- Switch from edit mode to view mode
- Toast: "Changes discarded"
- If triggered by navigation → allow navigation to proceed

---

## 3. Responsive Design (NFR-U-01)

> **Note**: Figma only provides desktop layout. The following responsive specs are **spec-defined** to satisfy `NFR-U-01`.

### 3.1 Article List Page

| Breakpoint | Layout Changes |
| :--- | :--- |
| **Desktop** (≥1280px) | Sidebar visible, article cards in 3-column grid, comfortable padding |
| **Tablet** (768–1279px) | Sidebar collapsed, cards in 2-column grid, 16px padding |
| **Mobile** (≤767px) | No sidebar (hamburger), cards in 1-column stack, full-width cards, 12px padding |

**Mobile Article Card**:
```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │   Thumbnail Image     │  │
│  └───────────────────────┘  │
│  Article Title              │
│  Category: News  📄 Draft   │
│  By John Smith • Jul 21     │
│                    [View →] │
└─────────────────────────────┘
```

### 3.2 Create/Edit Article Page

| Breakpoint | Layout Changes |
| :--- | :--- |
| **Desktop** | Form centered (max-width: 800px), rich-text editor with full toolbar |
| **Tablet** | Full-width with 24px padding, editor toolbar wraps to 2 rows |
| **Mobile** | Full-width 12px padding, editor toolbar simplified (fewer buttons), image upload area full-width |

### 3.3 Article Detail (View Mode)

| Breakpoint | Layout Changes |
| :--- | :--- |
| **Desktop** | Centered reading view (max-width: 720px), comfortable line-height |
| **Tablet** | Full-width with 24px padding |
| **Mobile** | Full-width 12px padding, images scale to 100% width |

---

## 4. Figma vs. UseCaseSpec Alignment Review

| Figma Screen | Matches UC? | Notes |
| :--- | :--- | :--- |
| Article list with thumbnails | ✅ BC-UC-09 | Card layout with images visible in Figma |
| Create article form | ✅ BC-UC-08 | Rich-text area visible, image upload area present |
| Article detail view | ✅ BC-UC-09 | Full article rendering with title/body |
| Article edit mode | ✅ BC-UC-09 | Same form as create, pre-populated |
| Article edit cancel flow | ✅ Fully specified | **Spec defines cancel dialog, unsaved changes guard, keyboard shortcuts** — not explicit in Figma |
| Responsive layouts | ✅ Fully specified | **Spec defines mobile/tablet for all pages** — not in Figma |

> **✅ RESOLVED (was ⚠)**: The article edit cancel flow is now fully specified in Section 2.3.1 with step-by-step flow diagram, `useBlocker` + `beforeunload` integration, ESC key handler, and discard confirmation dialog. Frontend devs can implement without Figma update.

> **ℹ Rich Text Editor**: Spec recommends **TipTap** (lightweight, modern, customizable) or **React-Quill** as fallback. Both support the "rich-text editing" requirement from `BC-UC-08` Special Requirements.

