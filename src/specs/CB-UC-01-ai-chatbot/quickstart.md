# Quickstart: AI Chatbot (CB-UC-01)

This quickstart explains how to spin up and test the AI Chatbot feature locally, which spans the Node.js backend and the Python FastAPI service.

## Prerequisites
- Node.js environment configured (for the backend).
- Python 3.10+ installed.
- Hugging Face account (for deploying the FastAPI Space eventually).
- Gemini API Key.
- Local MongoDB instance or Atlas cluster.

## 1. Environment Setup

### Node.js Backend (`.env`)
Ensure you have the Service Token secret configured:
```env
AI_SERVICE_TOKEN_SECRET=your_super_secure_random_string_here
```

### Python FastAPI Service
Navigate to the AI service directory and create an `.env` file:
```env
GEMINI_API_KEY=your_gemini_key
MONGODB_URI=your_mongodb_connection_string
AI_SERVICE_TOKEN_SECRET_CURRENT=your_super_secure_random_string_here
AI_SERVICE_TOKEN_SECRET_PREVIOUS=optional_previous_string_for_rotation
AI_SERVICE_TOKEN_KID=local-dev-key-1
```
> [!WARNING]
> `AI_SERVICE_TOKEN_SECRET_CURRENT` must strictly match the active secret in the Node.js backend. The FastAPI service verifies the token using the secret corresponding to the `kid` in the token header, allowing seamless local rotation testing using the `PREVIOUS` key.

## 2. Install Python Dependencies
In the AI service directory, install the required packages:
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```
*(Dependencies include `fastapi`, `uvicorn`, `langchain`, `sentence-transformers`, `pymongo`, etc.)*

Use a supported CPython 3.11–3.13 installation. If an existing virtual
environment no longer starts (for example, after upgrading or removing
Python), delete only that environment directory and recreate it with the
command above.

## 3. Data Ingestion (One-Time)
Run the provided ingestion script to populate your MongoDB `knowledge_base_docs` with the handbook content from `vi.json`.
```bash
python scripts/ingest_knowledge.py
```
> [!NOTE]
> The TF-IDF index does NOT need to be saved. The FastAPI service will automatically pull from `knowledge_base_docs` and build its TF-IDF index in-memory upon startup.

## 4. Run the Services

### Start the AI Service (FastAPI)
```bash
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
You should see output indicating that the Sentence Transformer model has loaded into memory and the TF-IDF index has been rebuilt.

### Recommended: start the AI Service with Docker
From the repository root, run:
```bash
docker compose up --build -d ai-service
```

This maps the container's port `7860` to `http://127.0.0.1:8000`, which is
the default `AI_SERVICE_URL` used by the Node.js backend. Confirm it is ready
before opening the chatbot:
```bash
curl http://127.0.0.1:8000/health
```

### Start the Node.js Backend
```bash
npm run dev
```

## 5. Verify the Integration

Send a test request through the Node.js backend to ensure the Service Token and gateway proxying work correctly.

```bash
curl -X POST http://localhost:3000/api/v1/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Điều kiện để hiến máu là gì?"}'
```

**Expected Outcome**: You should receive a JSON response with the `contentText` answering the question using retrieved knowledge, along with citations referring back to the Source IDs.
