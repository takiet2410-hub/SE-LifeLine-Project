# Data Model: AI Chatbot (CB-UC-01)

## 1. MongoDB Collections

### 1.1 `knowledge_base_docs`
Stores medical guidelines, FAQs, and semantic knowledge.

| Field | Type | Description | Required |
|---|---|---|---|
| `_id` | ObjectId | Unique document identifier. | Yes |
| `title` | String | Title of the knowledge article. | Yes |
| `sourceContent` | String | Raw text content used for embeddings and generation. | Yes |
| `embeddingVector` | Array<Float> | Pre-computed dense embedding vector (e.g., 768d). | No (computed on fly if missing) |
| `createdAt` | Date | Document creation timestamp. | Yes |

### 1.2 `chat_conversations` (Managed by Node.js Backend)
Tracks isolated chat sessions for both guests and donors.

| Field | Type | Description | Required |
|---|---|---|---|
| `_id` | ObjectId | Conversation ID. | Yes |
| `donorId` | ObjectId | Linked donor account (null if anonymous). | No |
| `guestSessionHash`| String | Secure hash for anonymous session continuity. | No |
| `status` | String | `Active`, `Closed`, `TimedOut`. | Yes |

## 2. In-Memory Stores

### 2.1 `Semantic Cache` (Local JSON: `semantic_cache.json`)
Stores Key-Value pairs of query vectors to responses.

```json
{
  "Điều kiện hiến máu là gì?": "Để hiến máu, bạn cần đủ 18-60 tuổi, cân nặng trên 42kg (nữ)..."
}
```

### 2.2 `FAISS Indexes`
- **Knowledge FAISS**: Loaded from MongoDB `knowledge_base_docs`.
- **Cache FAISS**: Loaded from `semantic_cache.json` keys to compute L2 distance for query similarity.
