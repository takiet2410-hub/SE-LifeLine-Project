import os
import json
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from app.services.embeddings import get_embedding_model

CACHE_FILE = "semantic_cache.json"

_cache_data = {}  # query -> response
_faiss_index = None

def load_cache():
    global _cache_data, _faiss_index
    print("Loading Semantic Cache...")
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _cache_data = json.load(f)
        except Exception as e:
            print(f"Error loading cache: {e}")
            _cache_data = {}
    
    if _cache_data:
        texts = list(_cache_data.keys())
        metadatas = [{"response": _cache_data[q], "query": q} for q in texts]
        embeddings_model = get_embedding_model()
        _faiss_index = FAISS.from_texts(texts, embeddings_model, metadatas=metadatas)
        print(f"Semantic Cache loaded with {len(texts)} entries.")
    else:
        _faiss_index = None
        print("Semantic Cache is empty.")

def get_cached_response(query: str, max_l2_distance: float = 0.2):
    """
    Search FAISS for a similar query. L2 distance < 0.2 means very similar.
    Returns the cached response if found, else None.
    """
    if not _faiss_index:
        return None
        
    try:
        results = _faiss_index.similarity_search_with_score(query, k=1)
        if not results:
            return None
            
        doc, score = results[0]
        # FAISS L2 distance: lower is more similar. 0 is exact match.
        if score < max_l2_distance:
            print(f"Semantic Cache HIT! Score: {score}")
            return doc.metadata.get("response")
    except Exception as e:
        print(f"Error in Semantic Cache search: {e}")
        
    return None

def save_to_cache(query: str, response: str):
    global _cache_data, _faiss_index
    _cache_data[query] = response
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_cache_data, f, ensure_ascii=False, indent=2)
            
        embeddings_model = get_embedding_model()
        metadata = {"response": response, "query": query}
        
        if _faiss_index is None:
            _faiss_index = FAISS.from_texts([query], embeddings_model, metadatas=[metadata])
        else:
            _faiss_index.add_texts([query], metadatas=[metadata])
        print("Semantic Cache updated.")
    except Exception as e:
        print(f"Error saving to Semantic Cache: {e}")
