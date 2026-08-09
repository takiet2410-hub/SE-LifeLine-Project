import os
import json
import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
MONGODB_URI = os.getenv('MONGODB_URI')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not MONGODB_URI or not GEMINI_API_KEY:
    print("MONGODB_URI or GEMINI_API_KEY is not set. Please check your .env file.")
    exit(1)

# Initialize MongoDB Client
client = MongoClient(MONGODB_URI)
db = client.get_database('LifeLine') # Ensure the database name matches
collection = db.get_collection('knowledge_base_docs')

# Load Google Embeddings
print("Loading GoogleGenerativeAIEmbeddings...")
from langchain_google_genai import GoogleGenerativeAIEmbeddings
model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=GEMINI_API_KEY)
print("Model loaded successfully.")

# Load the vi.json file
vi_json_path = os.path.join(os.path.dirname(__file__), '../../src/frontend/src/i18n/vi.json')
with open(vi_json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract handbook contents
handbook = data.get('dashboard', {}).get('handbookContent', {})

docs_to_insert = []
source_id_counter = 1

for category_key, category_data in handbook.items():
    title = category_data.get('title', '')
    
    # Process each section
    for key, value in category_data.items():
        if key == 'title':
            continue
            
        if key.endswith('Title'):
            # Example key: "section1Title"
            section_idx = key.replace('section', '').replace('Title', '')
            points_key = f"section{section_idx}Points"
            
            section_title = value
            section_points = category_data.get(points_key, [])
            
            # Combine points into a single text block
            content = f"{section_title}\n" + "\n".join(f"- {p}" for p in section_points)
            full_text = f"{title} - {content}"
            
            # Generate embedding
            print(f"Generating embedding for: {section_title}...")
            embedding = model.embed_query(full_text)
            
            doc = {
                "sourceId": f"SRC-KB-{source_id_counter:03d}",
                "title": f"{title} - {section_title}",
                "category": category_key.capitalize(),
                "sourceContent": content,
                "embeddingVector": embedding,
                "metadata": {
                    "language": "vi",
                    "targetAudience": "Donor",
                    "lastUpdated": datetime.datetime.utcnow()
                }
            }
            docs_to_insert.append(doc)
            source_id_counter += 1

if docs_to_insert:
    # Clear existing to prevent duplicates during testing
    print("Clearing existing knowledge_base_docs...")
    collection.delete_many({})
    
    print(f"Inserting {len(docs_to_insert)} documents into MongoDB...")
    collection.insert_many(docs_to_insert)
    print("Knowledge base ingestion complete!")
else:
    print("No documents found to ingest.")
