"""
AquaCrop Live LLM Provider Service
Supports Groq API (llama-3.1-8b-instant) and OpenAI-compatible live LLM completions.
Grounds free-form answers strictly in deterministic AquaCrop engine outputs.
"""
from typing import Any
import httpx
from app.config import settings


async def query_live_llm(
    prompt: str,
    system_context: str,
    language: str = "en",
    temperature: float = 0.3,
) -> dict[str, Any]:
    """
    Queries live Groq API or OpenAI-compatible provider if API key is configured.
    Falls back gracefully to AquaCrop grounded template response if key is missing or network fails.
    """
    api_key = settings.groq_api_key or ""
    model = settings.groq_model or "llama-3.1-8b-instant"

    if not api_key:
        return {
            "provider": "aquacrop_engine_grounded",
            "model": "template_fallback",
            "status": "NO_API_KEY",
            "response": None,
        }

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    lang_instruction = "Respond in natural, fluent Telugu script (తెలుగు)." if language.startswith("te") else "Respond in clear, professional English."
    
    system_prompt = (
        "You are AquaCrop AI, an expert, trustworthy agricultural intelligence assistant for farmers in India.\n"
        f"{lang_instruction}\n"
        "RULES:\n"
        "1. Strictly use the provided field, weather, soil, ML crop recommendations, and irrigation engine facts.\n"
        "2. Do NOT invent fake numerical sensor data or fake yield predictions.\n"
        "3. Emphasize safety: Explain that free-text chat cannot directly start pumps without human confirmation.\n"
        f"Context:\n{system_context}"
    )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": 512,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
            reply_content = data["choices"][0]["message"]["content"]
            return {
                "provider": "groq",
                "model": model,
                "status": "SUCCESS",
                "response": reply_content.strip(),
            }
    except Exception as e:
        print(f"[LLM WARNING] Groq API query failed ({e}). Using grounded engine response.")
        return {
            "provider": "aquacrop_engine_grounded",
            "model": model,
            "status": f"FAILED: {e}",
            "response": None,
        }
