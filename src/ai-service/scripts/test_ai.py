import asyncio
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv()
from app.generation.pipeline import process_chat_stream

async def test():
    async for chunk in process_chat_stream({'message': 'Quy trình hiến máu', 'donorContext': {}, 'history': []}):
        print(chunk, end='')

asyncio.run(test())
