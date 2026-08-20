import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from dotenv import load_dotenv
load_dotenv()
from typing import AsyncGenerator
from langchain_google_genai import ChatGoogleGenerativeAI
try:
    from langchain.agents import AgentExecutor, create_tool_calling_agent
except ImportError:
    from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.services.faiss_builder import search_knowledge_base, search_campaigns
from app.services.semantic_cache import get_cached_response, save_to_cache
from app.generation.prompts import SYSTEM_PROMPT

def get_llm(model_name: str = None):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
        
    target_model = model_name or os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    
    kwargs = {
        "model": target_model,
        "max_output_tokens": 4096,
        "google_api_key": api_key,
        "max_retries": 0,
    }
    
    # flash-lite models use fixed sampling defaults and will throw a UserWarning if temperature is set
    if "flash-lite" not in target_model.lower():
        kwargs["temperature"] = 0.2
        
    return ChatGoogleGenerativeAI(**kwargs)

async def _run_agent_stream(agent_executor, query, chat_history):
    full_text = ""
    async for event in agent_executor.astream_events(
        {"input": query, "chat_history": chat_history},
        version="v2"
    ):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            content = chunk.content
            if content:
                text_chunk = ""
                if isinstance(content, str):
                    text_chunk = content
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, str):
                            text_chunk += item
                        elif isinstance(item, dict) and item.get("type") == "text":
                            text_chunk += item.get("text", "")
                if text_chunk:
                    if len(full_text) > 0 and text_chunk.startswith(full_text):
                        delta = text_chunk[len(full_text):]
                        full_text = text_chunk
                        if delta:
                            yield delta
                    else:
                        full_text += text_chunk
                        yield text_chunk


async def process_chat_stream(request_data: dict) -> AsyncGenerator[str, None]:
    query = request_data.get("message", "")
    donor_context = request_data.get("donorContext", {})
    history_raw = request_data.get("history", [])
    
    # 1. Filter out error messages and system messages, then truncate to save context (keep up to 20 messages / 10 turns)
    valid_history = []
    for msg in history_raw:
        if isinstance(msg, dict) and "parts" in msg and msg["parts"]:
            first_part = msg["parts"][0]
            part_text = first_part.get("text", "") if isinstance(first_part, dict) else str(first_part)
            if part_text and not ("Rất tiếc" in part_text or "Quota Exceeded" in part_text or "⚠️" in part_text):
                valid_history.append(msg)

    history_truncated = valid_history[-20:] if len(valid_history) > 20 else valid_history
    
    # 2. Fast Intent Routing for everyday chat
    if donor_context:
        print(f"\n[DEBUG CONTEXT] Injecting Donor Context for authenticated user:")
        print(f" -> isEligibleNow: {donor_context.get('isEligibleNow')}")
        print(f" -> bloodType: {donor_context.get('bloodType')}")
        print(f" -> Active Campaigns: {len(donor_context.get('nearbyCampaigns', []))}")
        print(f" -> Donation History: {len(donor_context.get('donationHistory', []))} records")
        print(f" -> History Turns: {len(history_truncated)}")
    else:
        print(f"\n[DEBUG CONTEXT] Anonymous Guest (History Turns: {len(history_truncated)})")

    is_greeting = False
    lower_query = query.lower().strip()
    greeting_keywords = ["hi", "hello", "xin chào", "chào", "alo", "ê", "có ai không", "tạm biệt", "bye", "cảm ơn", "thanks", "khoẻ không", "khỏe không"]
    
    # Only match if the query is strictly a greeting, and only if there's no ongoing medical/detail multi-turn context
    if lower_query in greeting_keywords or (len(history_truncated) == 0 and any(lower_query.startswith(k + " ") for k in ["hi", "hello", "chào", "xin chào"])):
        is_greeting = True
    elif len(history_truncated) == 0:
        # LLM Router check (only for initial turn to avoid misclassifying multi-turn contextual follow-ups)
        try:
            primary_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
            fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite")
            router_llm = get_llm(fallback_model or primary_model) 
            router_prompt = ChatPromptTemplate.from_messages([
                ("system", "Bạn là bộ phân loại. Nếu câu hỏi là giao tiếp đời thường (chào hỏi, cảm ơn, đùa giỡn, hỏi thăm...) KHÔNG liên quan y tế, máu, lịch hẹn, trả lời '1'. Nếu có liên quan y tế/chuyên môn, trả lời '0'. CHỈ TRẢ LỜI 0 HOẶC 1."),
                ("human", "{input}")
            ])
            route_res = await (router_prompt | router_llm).ainvoke({"input": query})
            if "1" in route_res.content:
                is_greeting = True
        except Exception:
            pass

    donor_is_auth = donor_context.get("isAuthenticated", False) if donor_context else False
    
    # 3. Check Semantic Cache (Only for generic knowledge FAQ queries, never for personal statements or multi-turn)
    personal_indicators = [
        "tôi", "mình", "em", "anh", "tên", "tuổi", "nhóm máu", "của tôi", "nặng", "kg", 
        "uống", "thuốc", "bệnh", "đau", "triệu chứng", "ở gần", "quận", "huyện", "my", "i am", "i'm"
    ]
    is_personal_query = any(k in lower_query for k in personal_indicators)
    
    cached_response = None
    if not is_greeting and not donor_is_auth and len(history_truncated) == 0 and not is_personal_query:
        cached_response = get_cached_response(query)
        if cached_response:
            data = json.dumps({"text": cached_response}, ensure_ascii=False)
            yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
            return

    tools = [search_knowledge_base, search_campaigns] if not is_greeting else []
    
    formatted_sys = SYSTEM_PROMPT.format(
        donor_context=json.dumps(donor_context, ensure_ascii=False) if donor_context else "None",
        FRONTEND_URL=os.getenv("FRONTEND_URL", "http://localhost:5173")
    )
    
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=formatted_sys),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    # Convert history
    chat_history = []
    for msg in history_truncated:
        first_part = msg["parts"][0]
        text_content = first_part.get("text", "") if isinstance(first_part, dict) else str(first_part)
        if msg.get("role") == "user":
            chat_history.append(HumanMessage(content=text_content))
        else:
            chat_history.append(AIMessage(content=text_content))
            
    # Try primary model first, fallback to lite model if 429 Quota Exceeded occurs
    primary_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite")
    
    models_to_try = [primary_model]
    if fallback_model and fallback_model != primary_model:
        models_to_try.append(fallback_model)
        
    stream_success = False
    for model_idx, model_name in enumerate(models_to_try):
        try:
            llm = get_llm(model_name)
            
            if is_greeting:
                # Fast route without Agent
                chain = prompt | llm
                
                full_text = ""
                async for event in chain.astream_events(
                    {"input": query, "chat_history": chat_history, "agent_scratchpad": []},
                    version="v2"
                ):
                    kind = event["event"]
                    if kind == "on_chat_model_stream":
                        chunk = event["data"]["chunk"]
                        content = chunk.content
                        if content:
                            text_chunk = ""
                            if isinstance(content, str):
                                text_chunk = content
                            elif isinstance(content, list):
                                for item in content:
                                    if isinstance(item, str):
                                        text_chunk += item
                                    elif isinstance(item, dict) and item.get("type") == "text":
                                        text_chunk += item.get("text", "")
                            
                            if text_chunk:
                                if len(full_text) > 0 and text_chunk.startswith(full_text):
                                    delta = text_chunk[len(full_text):]
                                    full_text = text_chunk
                                else:
                                    delta = text_chunk
                                    full_text += text_chunk
                                
                                if delta:
                                    data = json.dumps({"text": delta}, ensure_ascii=False)
                                    yield f"data: {data}\n\n"
                                    stream_success = True
            else:
                # Normal agent route
                agent = create_tool_calling_agent(llm, tools, prompt)
                agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False)
                
                full_agent_response = ""
                async for chunk_text in _run_agent_stream(agent_executor, query, chat_history):
                    full_agent_response += chunk_text
                    data = json.dumps({"text": chunk_text}, ensure_ascii=False)
                    yield f"data: {data}\n\n"
                    stream_success = True
                
                # Save successful generic agent responses to Semantic Cache (only for non-personal standalone FAQ queries)
                if stream_success and not donor_is_auth and full_agent_response and len(history_truncated) == 0 and not is_personal_query:
                    save_to_cache(query, full_agent_response)
            
            if stream_success:
                break
        except Exception as err:
            err_str = str(err)
            print(f"Error executing AI generation with model {model_name}: {err_str}")
            
            # If not the last model, try fallback model
            if model_idx < len(models_to_try) - 1:
                print(f"Retrying with fallback model {models_to_try[model_idx + 1]}...")
                continue
                
            # Otherwise yield user-friendly error message
            is_quota_err = "429" in err_str or "Quota" in err_str or "RESOURCE_EXHAUSTED" in err_str
            err_msg = "Rất tiếc, hệ thống AI đang tạm thời gián đoạn. Vui lòng thử lại sau ít phút."
            if is_quota_err:
                err_msg = "⚠️ Hệ thống AI đã đạt giới hạn truy cập (Quota Exceeded). Vui lòng đợi khoảng 30-60 giây và thử lại câu hỏi của bạn."
            
            data = json.dumps({"text": err_msg}, ensure_ascii=False)
            yield f"data: {data}\n\n"
            break
            
    yield "data: [DONE]\n\n"

