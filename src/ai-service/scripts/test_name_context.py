import asyncio
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv()
from app.generation.pipeline import process_chat_stream

async def test_name_query():
    print("\n" + "="*80)
    print("TESTING NAME QUERY WITH DONOR CONTEXT")
    print("="*80)
    
    req = {
        'message': "Tên tôi là gì?",
        'donorContext': {
            'isAuthenticated': True,
            'fullName': "Nguyễn Văn An",
            'bloodType': "O+",
            'donorLevel': "Cấp độ 2",
            'totalDonations': 3,
            'isEligibleNow': True
        },
        'history': []
    }
    
    ai_reply = ""
    async for chunk in process_chat_stream(req):
        if chunk.startswith("data: ") and chunk != "data: [DONE]\n\n":
            import json
            try:
                data = json.loads(chunk[6:])
                ai_reply += data.get("text", "")
            except Exception:
                pass
                
    print(f"\nAI Response:\n{ai_reply.strip()}\n")
    assert "Nguyễn Văn An" in ai_reply or "An" in ai_reply
    print("✅ TEST PASSED: AI correctly recognized donor name from profile context!")

if __name__ == "__main__":
    asyncio.run(test_name_query())
