import os
from pymongo import MongoClient
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_core.tools import tool
from langchain_core.documents import Document
from app.services.embeddings import get_embedding_model

_vectorstore = None
_retriever = None

def build_faiss_index():
    global _vectorstore, _retriever
    load_dotenv()
    
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("No MONGODB_URI provided. Skipping FAISS build.")
        return
        
    client = MongoClient(mongo_uri)
    db = client.get_database('LifeLine')
    collection = db.get_collection('knowledge_base_docs')
    
    docs = list(collection.find({}))
    if not docs:
        print("No documents found in knowledge_base_docs. FAISS index empty.")
        return
        
    print(f"Building in-memory FAISS index for {len(docs)} documents...")
    
    texts_with_emb = []
    texts_missing_emb = []
    metadatas_with_emb = []
    metadatas_missing_emb = []
    text_embeddings = []
    
    for doc in docs:
        content = doc.get("sourceContent", "")
        title = doc.get("title", "")
        full_text = f"Title: {title}\nContent: {content}"
        
        meta = {
            "sourceId": doc.get("sourceId", str(doc["_id"])),
            "title": title
        }
        
        emb = doc.get("embeddingVector")
        if emb:
            text_embeddings.append((full_text, emb))
            metadatas_with_emb.append(meta)
        else:
            texts_missing_emb.append(full_text)
            metadatas_missing_emb.append(meta)
    
    embeddings = get_embedding_model()
    
    if text_embeddings:
        # Load precomputed embeddings
        _vectorstore = FAISS.from_embeddings(text_embeddings, embeddings, metadatas=metadatas_with_emb)
        # Compute embeddings for the missing ones and add them
        if texts_missing_emb:
            print(f"Computing embeddings on the fly for {len(texts_missing_emb)} missing documents...")
            _vectorstore.add_texts(texts_missing_emb, metadatas=metadatas_missing_emb)
    else:
        # Fallback to computing all embeddings on the fly
        print("Warning: Missing all embeddingVectors in DB. Computing on the fly...")
        _vectorstore = FAISS.from_texts(texts_missing_emb, embeddings, metadatas=metadatas_missing_emb)
        
    _retriever = _vectorstore.as_retriever(search_kwargs={"k": 5})
    print("FAISS index built successfully.")

def get_retriever():
    if _retriever is None:
        build_faiss_index()
    return _retriever

@tool
def search_knowledge_base(query: str) -> str:
    """Tra cứu cơ sở tri thức (Knowledge Base) về quy định y tế, điều kiện hiến máu, và lưu ý sức khỏe.
    CHỈ GỌI tool này khi người dùng hỏi về kiến thức chuyên môn, quy định y tế, hoặc các câu hỏi nằm ngoài thông tin cá nhân của họ. Không gọi tool này cho các câu chào hỏi bình thường."""
    retriever = get_retriever()
    if not retriever:
        return "Không có dữ liệu trong hệ thống."
        
    docs = retriever.invoke(query)
    if not docs:
        return "Không tìm thấy kết quả phù hợp."
        
    results = []
    print(f"\n[DEBUG RAG] AI is retrieving knowledge for query: '{query}'")
    for doc in docs:
        title = doc.metadata.get('title', 'Unknown')
        print(f" -> Found Document: {title}")
        results.append(f"[Nguồn: {title}]\n{doc.page_content}")
        
    return "\n\n".join(results)
