import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

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
            print(f"Computing and saving embeddings for {len(texts_missing_emb)} missing documents...")
            missing_embs = embeddings.embed_documents(texts_missing_emb)
            
            # Save to DB
            from bson import ObjectId
            for i, meta in enumerate(metadatas_missing_emb):
                try:
                    doc_id = ObjectId(meta["sourceId"])
                    collection.update_one({"_id": doc_id}, {"$set": {"embeddingVector": missing_embs[i]}})
                except Exception as e:
                    print(f"Failed to update embedding in DB for {meta['sourceId']}: {e}")
            
            # Add to FAISS
            text_embeddings_new = list(zip(texts_missing_emb, missing_embs))
            _vectorstore.add_embeddings(
                text_embeddings=text_embeddings_new,
                metadatas=metadatas_missing_emb
            )
    else:
        # Fallback to computing all embeddings on the fly
        print("Warning: Missing all embeddingVectors in DB. Computing and saving...")
        missing_embs = embeddings.embed_documents(texts_missing_emb)
        
        # Save to DB
        from bson import ObjectId
        for i, meta in enumerate(metadatas_missing_emb):
            try:
                doc_id = ObjectId(meta["sourceId"])
                collection.update_one({"_id": doc_id}, {"$set": {"embeddingVector": missing_embs[i]}})
            except Exception as e:
                print(f"Failed to update embedding in DB for {meta['sourceId']}: {e}")
                
        text_embeddings_new = list(zip(texts_missing_emb, missing_embs))
        _vectorstore = FAISS.from_embeddings(
            text_embeddings_new, 
            embeddings, 
            metadatas=metadatas_missing_emb
        )
        
    _retriever = _vectorstore.as_retriever(search_kwargs={"k": 5})
    print("FAISS index built successfully.")

def get_retriever():
    if _retriever is None:
        build_faiss_index()
    return _retriever

@tool
def search_knowledge_base(query: str) -> str:
    """Công cụ BẮT BUỘC SỬ DỤNG để tra cứu cơ sở tri thức (Knowledge Base) về: quy trình hiến máu, điều kiện sức khỏe, lợi ích, và các lưu ý trước/sau khi hiến máu.
    LUÔN LUÔN gọi công cụ này trước khi trả lời bất kỳ câu hỏi nào liên quan đến kiến thức hiến máu hoặc quy định y tế, để lấy dữ liệu chính xác nhất."""
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

@tool
def search_campaigns(query: str = "") -> str:
    """Công cụ BẮT BUỘC SỬ DỤNG để tra cứu danh sách các chiến dịch / điểm hiến máu ĐANG MỞ HOẶC SẮP TỚI (loại bỏ chiến dịch đã hủy, đã kết thúc, hoặc đã hết giờ làm việc hôm nay) từ MongoDB.
    DÙNG CÔNG CỤ NÀY khi người dùng hỏi về: chiến dịch hiến máu, điểm hiến máu, địa chỉ hiến máu, lịch hiến máu ở đâu, quận huyện nào có hiến máu, hoặc muốn đặt lịch hiến máu."""
    import datetime
    load_dotenv()
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        return "Không thể kết nối cơ sở dữ liệu chiến dịch."
        
    client = MongoClient(mongo_uri)
    db = client.get_database('LifeLine')
    campaigns_coll = db.get_collection('campaigns')
    
    # 1. Fetch raw campaigns excluding Cancelled, Draft, and Completed
    raw_campaigns = list(campaigns_coll.find({
        "status": {"$nin": ["Cancelled", "Draft", "Completed", "cancelled", "draft", "completed"]}
    }).sort("startDateTime", 1))
    
    # 2. Real-time dynamic filtering (matching Frontend Schedule UI logic)
    now = datetime.datetime.now()
    today_str = now.strftime('%Y-%m-%d')
    current_time_str = now.strftime('%H:%M')
    
    valid_campaigns = []
    for c in raw_campaigns:
        start_dt = c.get('startDateTime')
        end_dt = c.get('endDateTime')
        
        # If no dates, skip
        if not start_dt or not end_dt:
            continue
            
        # If campaign has fully ended in the past
        if end_dt < now:
            continue
            
        # Check if campaign is today: verify if working hours have passed
        end_date_str = end_dt.strftime('%Y-%m-%d')
        if end_date_str == today_str:
            # Check dailyTimeslots or timeslots
            daily_slots = c.get('dailyTimeslots') or []
            today_slots = [s for s in daily_slots if s.get('dateStr') == today_str]
            general_slots = c.get('timeslots') or []
            slots_to_check = today_slots if today_slots else general_slots
            
            if slots_to_check:
                latest_end = max([s.get('endTime', '00:00') for s in slots_to_check], default='00:00')
                if latest_end and latest_end != '00:00' and current_time_str >= latest_end:
                    # Working hours for today have already ended!
                    continue
                    
        # Check remaining capacity
        cap = c.get('capacity', 0) or 0
        reg = c.get('registeredCount', 0) or 0
        
        valid_campaigns.append(c)
        
    # 3. Filter by keyword/location query if specified by user
    if query and query.strip():
        q = query.strip().lower()
        filtered = []
        for c in valid_campaigns:
            name = (c.get('name') or '').lower()
            venue = (c.get('venue') or '').lower()
            addr = (c.get('fullAddress') or '').lower()
            blood_types = [str(b).lower() for b in (c.get('targetBloodGroups') or [])]
            
            if q in name or q in venue or q in addr or any(q in bt for bt in blood_types):
                filtered.append(c)
                
        if filtered:
            valid_campaigns = filtered
            
    campaigns = valid_campaigns[:3]
    
    if not campaigns:
        return "Hiện tại không có điểm hiến máu nào đang trong giờ làm việc hoặc sắp tới phù hợp với yêu cầu.\n\n[SCHEDULE_PAGE_CTA:{\"title\": \"Trang Đặt Lịch Hiến Máu LifeLine\", \"description\": \"Tra cứu toàn bộ các điểm tiếp nhận trên bản đồ & chọn giờ hẹn\", \"url\": \"/my-appointments/schedule/step-1\"}]"
        
    results = []
    print(f"\n[DEBUG CAMPAIGNS] AI filtered top {len(campaigns)} active & upcoming valid campaigns for: '{query}'")
    for c in campaigns:
        start_str = c.get('startDateTime').strftime('%d/%m/%Y %H:%M') if c.get('startDateTime') else 'Đang cập nhật'
        end_str = c.get('endDateTime').strftime('%d/%m/%Y %H:%M') if c.get('endDateTime') else ''
        date_display = f"{start_str} - {end_str}" if end_str else start_str
        
        venue = c.get('venue') or c.get('name') or 'Điểm hiến máu'
        addr = c.get('fullAddress') or venue
        blood_types = ", ".join(c.get('targetBloodGroups', [])) if c.get('targetBloodGroups') else "Tất cả nhóm máu (A, B, AB, O)"
        cid = str(c.get('_id'))
        
        results.append(
            f"- Chiến dịch: {c.get('name')}\n"
            f"  Địa điểm: {venue}\n"
            f"  Địa chỉ: {addr}\n"
            f"  Thời gian: {date_display}\n"
            f"  Nhóm máu tiếp nhận: {blood_types}\n"
            f"  Định dạng thẻ: [CAMPAIGN_CARD:{{\"id\": \"{cid}\", \"name\": \"{c.get('name')}\", \"location\": \"{venue}\", \"address\": \"{addr}\", \"date\": \"{date_display}\", \"bloodTypes\": \"{blood_types}\", \"url\": \"http://localhost:5173/my-appointments/schedule/step-1\"}}]"
        )
        
    return "\n\n".join(results) + "\n\n[SCHEDULE_PAGE_CTA:{\"title\": \"Trang Đặt Lịch Hiến Máu LifeLine\", \"description\": \"Chọn điểm hiến máu gần nhất & đặt trước khung giờ 30 phút\", \"url\": \"/my-appointments/schedule/step-1\"}]"
