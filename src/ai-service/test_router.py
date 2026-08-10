import asyncio
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv()
from app.generation.pipeline import get_llm
from langchain_core.prompts import ChatPromptTemplate

async def test():
    llm = get_llm('gemini-2.0-flash-lite')
    p = ChatPromptTemplate.from_messages([
        ('system', "Bạn là bộ phân loại. Nếu câu hỏi là giao tiếp đời thường (chào hỏi, cảm ơn, đùa giỡn, hỏi thăm...) KHÔNG liên quan y tế, máu, lịch hẹn, trả lời '1'. Nếu có liên quan y tế/chuyên môn, trả lời '0'. CHỈ TRẢ LỜI 0 HOẶC 1."),
        ('human', '{input}')
    ])
    for q in ['nhóm máu', 'quy trình hiến máu', 'hiến máu']:
        res = await (p | llm).ainvoke({'input': q})
        print(f'{q} : {res.content}')

asyncio.run(test())
