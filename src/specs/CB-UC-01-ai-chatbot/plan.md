# Technical Plan: AI Chatbot (CB-UC-01)

## Technical Summary
The AI Chatbot is implemented as a standalone FastAPI service communicating with the Node.js Backend Core via REST/SSE. It utilizes LangChain for Agentic orchestration, Google Generative AI (Gemini 2.0 Flash/Flash-Lite) for reasoning, and FAISS for both RAG Knowledge Retrieval and Semantic Caching.

## Architecture Overview

```ascii
+-------------------+        +--------------------+       +----------------------+
|                   |  SSE   |                    | HTTP  |                      |
|  React Frontend   |<-------|  Node.js Backend   |<------|  Python AI Service   |
| (ChatbotWidget)   |=======>| (chatbot.ctrl.ts)  |======>| (FastAPI pipeline)   |
|                   |        |                    |       |                      |
+-------------------+        +--------------------+       +----------------------+
                                                               |    |    |
                                      +------------------------+    |    +---------------+
                                      |                             |                    |
                              +---------------+             +---------------+    +---------------+
                              | Intent Router |             | Semantic Cache|    | FAISS RAG     |
                              | (Flash-Lite)  |             | (FAISS + JSON)|    | (MongoDB Docs)|
                              +---------------+             +---------------+    +---------------+
```

## Requirement Traceability Matrix

| Req ID | Description | Implementation Component | Status |
|---|---|---|---|
| CB-FR-001 | Fast Intent Routing | `pipeline.py` (is_greeting regex/LLM) | Implemented |
| CB-FR-002 | Semantic Caching | `semantic_cache.py`, `pipeline.py` | Implemented |
| CB-FR-003 | RAG Knowledge Retrieval | `faiss_builder.py`, MongoDB | Implemented |
| CB-FR-004 | Context Injection | `prompts.py` (SYSTEM_PROMPT) | Implemented |
| CB-FR-005 | Streaming Output | `chatbot.controller.ts`, FastAPI SSE | Implemented |

## Business Rules & Logic Implementation

### 1. Semantic Caching Logic
To prevent privacy leaks, the cache is **strictly bypassed** if `donorContext.isAuthenticated` is true. The cache uses FAISS L2 distance to evaluate semantic similarity (threshold < 0.25). Cache hits immediately yield the response chunk and terminate the pipeline.

### 2. Quota Protection
To avoid 60-second timeouts during 429 Quota Exceeded errors from Google API, `max_retries=0` is configured on the `ChatGoogleGenerativeAI` instance.

### 3. State Mutation Safety
The frontend `ChatbotWidget` clones the React state (`[...prev, newMsg]`) to prevent cumulative duplicate text rendering during SSE streams.

## API Endpoints Overview

### AI Service
- `POST /api/ai/chat/stream`: Main entry point. Expects `query`, `chat_history`, and `donor_context`. Yields SSE `data: {"text": "..."}` chunks.

### Node.js Backend
- `POST /api/v1/chatbot/message`: Authenticates user (optional), attaches `donorContext`, forwards request to AI Service, appends disclaimers to final response.
