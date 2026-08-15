import sys
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from app.api.routes import router
from app.services.faiss_builder import build_faiss_index
from app.services.embeddings import load_embedding_model
from app.services.semantic_cache import load_cache

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Initializing AI Service...")
    load_embedding_model()
    build_faiss_index()
    load_cache()
    print("AI Service initialized.")
    yield
    # Shutdown actions
    print("Shutting down AI Service...")

app = FastAPI(
    title="LifeLine AI Chatbot Service",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

