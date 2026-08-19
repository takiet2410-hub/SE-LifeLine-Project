# Quickstart & Validation Scenarios: Article Management (BC-UC-08, BC-UC-09, Delete Article)

**Feature Path**: `specs/BC-UC-08-09-content-management`

---

## 1. Environment Setup & Prerequisites

1. Ensure MongoDB connection is configured in `src/backend-core/.env`.
2. Start backend server:
   ```bash
   cd src/backend-core
   npm run dev
   ```
3. Start frontend Vite server:
   ```bash
   cd src/frontend
   npm run dev
   ```
4. Access Content Management dashboard at: `http://localhost:5173/bc/content`

---

## 2. Runnable Validation Scenarios

### Scenario 1: Create & Publish Article Immediately (BC-UC-08)
1. Click **Create Article** button at `/bc/content`.
2. Enter Title: `"Thông báo hiến máu hè 2026"`.
3. Select Category: `"News"`, Target Audience: `Donors`, `Staff`.
4. Enter body text in Rich Text Editor.
5. Set status toggle to **Published** and click **Save Article**.
6. **Expected Outcome**: Success toast notification displayed; article appears on the content dashboard with green `Published` status tag and author name.

### Scenario 2: Save Draft & Autosave Indicator
1. Click **Create Article**.
2. Type Title: `"Dự thảo bài viết mới"`.
3. Pause typing for 3 seconds.
4. **Expected Outcome**: Bottom indicator updates to `"Auto-saved just now"`. Article is stored as `Draft`.

### Scenario 3: View Performance Panel & Edit Article (BC-UC-09)
1. Click on an existing article card.
2. Verify category tag, cover image, read time, **Performance Panel** (Views, Reach, Shares), and **Engagement Note** insight.
3. Click **Edit Article** in Quick Actions panel.
4. Modify title and category, then click **Save**.
5. **Expected Outcome**: Article details update immediately with success message.

### Scenario 4: Delete Article with Modal Confirmation
1. Click the **...** menu on an article card or **Delete Article** in the Quick Actions panel.
2. Verify warning modal appears: *"Are you sure you want to delete this article? This action cannot be undone."*
3. Click **Confirm Delete**.
4. **Expected Outcome**: Success toast displayed (`"Article deleted successfully"`); item is permanently removed from the list and dashboard Total Articles count decreases by 1.

### Scenario 5: Delete Non-Existent Article (Edge Case)
1. Trigger deletion for an article ID that was already deleted.
2. **Expected Outcome**: System displays error message (`"Article not found or already deleted"`) and refreshes list.
