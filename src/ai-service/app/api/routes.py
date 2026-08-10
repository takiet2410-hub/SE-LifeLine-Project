from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.middleware.auth import verify_token
from app.middleware.auth import verify_token

router = APIRouter()

class ChatMessagePart(BaseModel):
    text: str

class ChatMessage(BaseModel):
    role: str
    parts: List[ChatMessagePart]

class ChatRequest(BaseModel):
    message: str
    donorContext: Optional[Dict[str, Any]] = None
    history: Optional[List[ChatMessage]] = None
    conversationId: str
    clientRequestId: str

from fastapi.responses import StreamingResponse
from app.generation.pipeline import process_chat_stream

@router.post("/api/v1/ai/chat", dependencies=[Depends(verify_token)])
async def chat_endpoint(request: ChatRequest):
    return StreamingResponse(
        process_chat_stream(request.model_dump()), 
        media_type="text/event-stream"
    )

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/ready")
def readiness_check():
    # Will check if embeddings and tfidf are loaded
    # Placeholder for now
    return {"status": "ready"}
