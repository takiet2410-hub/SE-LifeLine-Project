# API Contract: Article Management (BC-UC-08, BC-UC-09, Delete Article)

**Base URL**: `/api/v1/bc/articles`

**Authentication**: Bearer JWT (`BloodCenterStaff` or `Administrator` role required)

---

## 1. List Articles & Dashboard Summary

### `GET /api/v1/bc/articles`
- **Query Parameters**:
  - `page`: integer (default 1)
  - `limit`: integer (default 10)
  - `category`: string (`News`, `Alert`, `Educational`, `Campaign`, `All`)
  - `status`: string (`Draft`, `Published`, `Scheduled`, `All`)
  - `search`: string (search title)
- **Response 200**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65f1a2b3c4d5e6f7a8b9c001",
        "title": "Hiến máu nhân đạo mùa hè 2026",
        "category": "News",
        "status": "Published",
        "coverImageUrl": "https://res.cloudinary.com/lifeline/article1.jpg",
        "authorName": "Dr. Sarah Chen",
        "publishedAt": "2026-07-28T08:00:00.000Z",
        "readTimeMinutes": 3,
        "viewsCount": 1250,
        "publicReachCount": 980,
        "sharesCount": 45,
        "targetAudience": ["Donors", "Staff"],
        "createdAt": "2026-07-28T07:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    },
    "summary": {
      "totalArticles": 12,
      "publicReach": 14500,
      "activeAlerts": 2
    }
  }
  ```

---

## 2. Create Article

### `POST /api/v1/bc/articles`
- **Request Body**:
  ```json
  {
    "title": "Kế hoạch hiến máu khẩn cấp nhóm O+",
    "bodyContent": "<p>Nhu cầu nhóm máu O+ đang ở mức báo động...</p>",
    "category": "Alert",
    "status": "Published",
    "coverImageUrl": "https://res.cloudinary.com/lifeline/alert-o.jpg",
    "scheduledAt": null,
    "targetAudience": ["Donors", "Hospitals"]
  }
  ```
- **Response 201**:
  ```json
  {
    "success": true,
    "message": "Article created and published successfully",
    "data": {
      "_id": "65f1a2b3c4d5e6f7a8b9c002",
      "title": "Kế hoạch hiến máu khẩn cấp nhóm O+",
      "status": "Published",
      "publishedAt": "2026-07-28T08:05:00.000Z"
    }
  }
  ```

---

## 3. Get Article Details & Analytics

### `GET /api/v1/bc/articles/:articleId`
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "65f1a2b3c4d5e6f7a8b9c001",
      "title": "Hiến máu nhân đạo mùa hè 2026",
      "bodyContent": "<p>Nội dung chi tiết bài viết...</p>",
      "category": "News",
      "status": "Published",
      "coverImageUrl": "https://res.cloudinary.com/lifeline/article1.jpg",
      "authorName": "Dr. Sarah Chen",
      "publishedAt": "2026-07-28T08:00:00.000Z",
      "readTimeMinutes": 3,
      "targetAudience": ["Donors", "Staff"],
      "performance": {
        "viewsCount": 1250,
        "publicReachCount": 980,
        "sharesCount": 45,
        "engagementNote": "This article has 24% more engagement than the average post this month"
      }
    }
  }
  ```

---

## 4. Update Article

### `PUT /api/v1/bc/articles/:articleId`
- **Request Body**: Partial or full update payload of article fields.
- **Response 200**:
  ```json
  {
    "success": true,
    "message": "Article updated successfully",
    "data": { ... }
  }
  ```

---

## 5. Delete Article

### `DELETE /api/v1/bc/articles/:articleId`
- **Response 200**:
  ```json
  {
    "success": true,
    "message": "Article deleted successfully",
    "deletedArticleId": "65f1a2b3c4d5e6f7a8b9c001"
  }
  ```
- **Response 404**:
  ```json
  {
    "success": false,
    "message": "Article not found or already deleted"
  }
  ```
