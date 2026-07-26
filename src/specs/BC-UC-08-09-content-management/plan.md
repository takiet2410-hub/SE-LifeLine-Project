# Plan: BC-UC-08 → BC-UC-09 — Content Management (Frontend)

> **Module**: `src/frontend/src/modules/content-mgmt/`
> **Stack**: React + TypeScript (strict) + Tailwind CSS + React Query + i18next
> **Reference**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-08-09-content-management/spec.md)

---

## 1. Component Architecture

```
src/frontend/src/modules/content-mgmt/
├── pages/
│   ├── ArticleListPage.tsx            # BC-UC-09 entry — card grid view
│   ├── CreateArticlePage.tsx          # BC-UC-08 — article creation form
│   └── ArticleDetailPage.tsx          # BC-UC-09 — view/edit article
│
├── components/
│   ├── ArticleCard.tsx                # Thumbnail + title + status card
│   ├── ArticleGrid.tsx                # Responsive grid of ArticleCards
│   ├── ArticleForm.tsx                # Shared create/edit form (title, category, content, images)
│   ├── ArticleStatusBadge.tsx         # Draft/Published/Unpublished badge
│   ├── ArticleRenderer.tsx            # Renders rich-text HTML content safely
│   ├── ImageUploader.tsx              # Drag & drop / click-to-upload image (Cloudinary)
│   └── RichTextEditor.tsx             # Wrapper around TipTap or React-Quill
│
├── hooks/
│   ├── useArticles.ts                 # React Query: GET /api/v1/bc/articles
│   ├── useArticle.ts                  # React Query: GET /api/v1/bc/articles/:id
│   ├── useCreateArticle.ts            # React Query mutation: POST /api/v1/bc/articles
│   ├── useUpdateArticle.ts            # React Query mutation: PUT /api/v1/bc/articles/:id
│   └── useUploadImage.ts             # React Query mutation: POST /api/v1/bc/upload
│
├── schemas/
│   └── articleSchema.ts               # Zod schema for article form
│
├── types/
│   └── article.types.ts               # TypeScript interfaces
│
└── i18n/
    ├── content.vi.json
    └── content.en.json
```

---

## 2. Routing Plan

```typescript
const contentRoutes = [
  { path: '/bc/content',               element: <ArticleListPage /> },
  { path: '/bc/content/create',         element: <CreateArticlePage /> },
  { path: '/bc/content/:articleId',     element: <ArticleDetailPage /> },
];
```

---

## 3. API Integration

| Method | Path | UC | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/bc/articles` | BC-UC-09 | List articles (paginated, filterable) |
| POST | `/bc/articles` | BC-UC-08 | Create article |
| GET | `/bc/articles/:id` | BC-UC-09 | Get article detail |
| PUT | `/bc/articles/:id` | BC-UC-09 | Update article |
| POST | `/bc/upload` | BC-UC-08 | Upload image to Cloudinary |

---

## 4. Validation Schema (Zod)

```typescript
// articleSchema.ts
import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(1, 'Article title is required'),
  category: z.string().min(1, 'Category is required'),
  bodyContent: z.string().min(1, 'Article content cannot be empty'),
  imageUrls: z.array(z.string().url()).optional(),
  status: z.enum(['Draft', 'Published']),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
```

---

## 5. Rich Text Editor Selection

**Recommendation: TipTap**

| Criteria | TipTap | React-Quill |
| :--- | :--- | :--- |
| Modern API | ✅ Headless, React hooks | ⚠ Wrapper-based |
| TypeScript support | ✅ Native | ⚠ Community types |
| Bundle size | ~40KB | ~50KB |
| Customization | ✅ Extensive | ⚠ Limited |
| Active maintenance | ✅ Active | ⚠ Slower updates |

Dependencies: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`

---

## 6. Image Upload Flow

1. Staff selects image via `ImageUploader.tsx` (drag-and-drop or file picker)
2. Frontend calls `POST /api/v1/bc/upload` with `multipart/form-data`
3. Backend (Multer → Cloudinary SDK) stores image, returns Cloudinary URL
4. URL is added to `imageUrls` array in article form state
5. Image preview displayed inline in the rich-text editor or as thumbnail
