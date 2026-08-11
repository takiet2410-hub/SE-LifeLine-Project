import os
import re
import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Hướng dẫn sử dụng:
# 1. Mở Terminal trong thư mục src/ai-service
# 2. Đảm bảo đã kích hoạt môi trường ảo (venv)
# 3. Chạy lệnh: python scripts/ingest_md.py
# Lưu ý: File LifeLine_Knowledge_Base_Detailed.md phải nằm chung trong thư mục src/ai-service.

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
MONGODB_URI = os.getenv('MONGODB_URI')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not MONGODB_URI or not GEMINI_API_KEY:
    print("Lỗi: Không tìm thấy MONGODB_URI hoặc GEMINI_API_KEY trong file .env.")
    exit(1)

client = MongoClient(MONGODB_URI)
db = client.get_database('LifeLine')
collection = db.get_collection('knowledge_base_docs')

print("Loading Embeddings Model (gemini-embedding-2)...")
from langchain_google_genai import GoogleGenerativeAIEmbeddings
model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=GEMINI_API_KEY)

md_path = os.path.join(os.path.dirname(__file__), '../LifeLine_Knowledge_Base_Detailed.md')
if not os.path.exists(md_path):
    print(f"Lỗi: Không tìm thấy file {md_path}")
    print("Vui lòng đảm bảo file LifeLine_Knowledge_Base_Detailed.md nằm ở thư mục src/ai-service.")
    exit(1)

with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

parts = content.split("## KB-")
docs_to_insert = []

for part in parts[1:]:
    lines = part.strip().split('\n')
    header = lines[0].strip()
    
    # Ví dụ: "EL-001 — Điều kiện chung để hiến máu"
    if "—" in header:
        source_id = "KB-" + header.split("—")[0].strip()
        title = header.split("—")[1].strip()
    else:
        source_id = "KB-" + header.split("-")[0].strip()
        title = header
    
    category = "General"
    for line in lines:
        if line.startswith("**Category:**"):
            match = re.search(r'`(.*?)`', line)
            if match:
                category = match.group(1)
            break
            
    doc_content = "\n".join(lines[1:]).strip()
    
    print(f"Embedding {source_id}...")
    text_to_embed = title + "\n" + doc_content
    embedding = model.embed_query(text_to_embed)
    
    # Dùng timezone-aware datetime theo khuyến nghị mới của Python
    now = datetime.datetime.now(datetime.timezone.utc)
    
    docs_to_insert.append({
        "sourceId": source_id,
        "category": category,
        "title": title,
        "sourceContent": doc_content,
        "embeddingVector": embedding,
        "metadata": {
            "language": "vi",
            "targetAudience": "Donor",
            "lastUpdated": now
        }
    })

print("\nĐang xóa dữ liệu Knowledge Base cũ trong MongoDB...")
collection.delete_many({})

if docs_to_insert:
    print(f"Đang chèn {len(docs_to_insert)} tài liệu mới...")
    collection.insert_many(docs_to_insert)
    print(f"THÀNH CÔNG: Đã ingest {len(docs_to_insert)} tài liệu vào MongoDB.")
else:
    print("Lỗi: Không tìm thấy tài liệu nào để ingest.")
