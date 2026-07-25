# Tasks: BC-UC-08 → BC-UC-09 — Content Management (Frontend)

> **Reference**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-08-09-content-management/spec.md) | [plan.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-08-09-content-management/plan.md)
> **Branch**: `feature/BC-UC-08-09-content-management`

---

## Phase 0: Dependencies & Setup

- [ ] **T-0.1**: Install rich-text editor
  - `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`
  - Or fallback: `react-quill`

- [ ] **T-0.2**: Create i18n translation files
  - `content.vi.json`, `content.en.json`

---

## Phase 1: Article List (BC-UC-09 entry)

- [ ] **T-1.1**: Create TypeScript types
  - `article.types.ts` — `Article`, `ArticleListResponse`, `ArticleListParams`

- [ ] **T-1.2**: Create React Query hooks
  - `useArticles.ts` — paginated list query

- [ ] **T-1.3**: Build `ArticleStatusBadge.tsx`
  - Draft=gray, Published=green, Unpublished=amber

- [ ] **T-1.4**: Build `ArticleCard.tsx`
  - Thumbnail image, title, category tag, status badge, date, author

- [ ] **T-1.5**: Build `ArticleGrid.tsx`
  - Responsive grid: 3 columns desktop, 2 tablet, 1 mobile

- [ ] **T-1.6**: Build `ArticleListPage.tsx`
  - "Create Article" button + filter controls
  - ArticleGrid with pagination
  - Empty state + loading skeleton

---

## Phase 2: Create Article (BC-UC-08)

- [ ] **T-2.1**: Create Zod schema
  - `articleSchema.ts` — `createArticleSchema`

- [ ] **T-2.2**: Build `RichTextEditor.tsx`
  - TipTap integration with toolbar (bold, italic, headings, lists, images, links)

- [ ] **T-2.3**: Build `ImageUploader.tsx`
  - Drag-and-drop zone + file picker + preview
  - Upload mutation → returns Cloudinary URL

- [ ] **T-2.4**: Build `ArticleForm.tsx`
  - Title, Category, Thumbnail, Rich Text Editor
  - Status toggle (Draft / Published)
  - React Hook Form + Zod

- [ ] **T-2.5**: Build `CreateArticlePage.tsx` (BC-UC-08)
  - ArticleForm wrapper
  - Save → create mutation
  - Cancel → discard confirmation dialog
  - Success/error toast + redirect

- [ ] **T-2.6**: Create hooks
  - `useCreateArticle.ts`, `useUploadImage.ts`

---

## Phase 3: Article View/Edit (BC-UC-09)

- [ ] **T-3.1**: Build `ArticleRenderer.tsx`
  - Safely render stored HTML content (sanitize with DOMPurify)

- [ ] **T-3.2**: Create hooks
  - `useArticle.ts`, `useUpdateArticle.ts`

- [ ] **T-3.3**: Build `ArticleDetailPage.tsx` (BC-UC-09)
  - View mode: ArticleRenderer + metadata (title, category, author, date)
  - Edit mode: ArticleForm pre-populated
  - Loading/NotFound/Error states

- [ ] **T-3.4**: Set up routes
  - `/bc/content`, `/bc/content/create`, `/bc/content/:articleId`

---

## Phase 4: Verification

- [ ] **T-4.1**: Type checking — `npx tsc --noEmit`
- [ ] **T-4.2**: Linting — `npm run lint`
- [ ] **T-4.3**: Visual QC vs Figma reference (article card layout, form layout)
- [ ] **T-4.4**: Functional test — create article, edit, change status, cancel flows
- [ ] **T-4.5**: Update Spec-Kit artifacts
