import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# If run directly via global python without venv activated, auto re-exec inside venv
script_dir = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.join(script_dir, "venv", "Scripts", "python.exe")
if sys.prefix == sys.base_prefix and os.path.exists(venv_python) and os.path.normpath(sys.executable).lower() != os.path.normpath(venv_python).lower():
    import subprocess
    sys.exit(subprocess.call([venv_python] + sys.argv))

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
