# Implementation Tasks: AI Chatbot (CB-UC-01)

## Phase 1: Core AI Infrastructure & Connectivity

- `[x]` Initialize FastAPI service structure (`main.py`, `routes.py`).
- `[x]` Set up Google Generative AI bindings in `pipeline.py`.
- `[x]` Connect `Node.js` Backend core to `FastAPI` via HTTP POST and setup proxy.

## Phase 2: RAG Knowledge Base

- `[x]` Create `faiss_builder.py` to embed documents from MongoDB `knowledge_base_docs`.
- `[x]` Write static seed scripts (`seed_ui_knowledge.py`, `seed_advanced_knowledge.py`).
- `[x]` Bind `search_knowledge_base` as a Tool in Langchain `AgentExecutor`.

## Phase 3: Fast Intent Routing & Streaming

- `[x]` Implement `is_greeting` detection (Regex + Fast LLM fallback).
- `[x]` Setup SSE response yielding in `pipeline.py`.
- `[x]` Fix frontend React state mutation bug (duplicate text during streaming).
- `[x]` Set `max_retries=0` to prevent 60s latency during 429 Quota Exceeded.

## Phase 4: Semantic Caching

- `[x]` Create `semantic_cache.py` using in-memory FAISS index and local JSON persistence.
- `[x]` Integrate `load_cache()` in FastAPI `lifespan` startup.
- `[x]` Add cache bypass logic for authenticated queries in `pipeline.py` to ensure privacy.
- `[x]` Yield cached responses immediately to achieve <0.5s latency.

## Phase 5: Testing & Validation

- `[x]` Test anonymous guest flow (Knowledge retrieval).
- `[x]` Test authenticated flow (Context injection for campaigns).
- `[x]` Verify Semantic Cache hits for repeated generic queries.
