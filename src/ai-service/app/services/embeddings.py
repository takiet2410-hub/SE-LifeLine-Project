import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings

_model = None

def load_embedding_model():
    global _model
    if _model is None:
        print("Loading GoogleGenerativeAIEmbeddings model...")
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        _model = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-2",
            google_api_key=api_key
        )
        print("GoogleGenerativeAIEmbeddings loaded.")
    return _model

def get_embedding_model():
    global _model
    if _model is None:
        load_embedding_model()
    return _model
