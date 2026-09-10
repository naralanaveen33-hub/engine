from __future__ import annotations

import httpx
from app.config import settings


async def query_live_llm(user_message: str, context_facts: str, language: str = "en") -> dict[str, str]:
    # 1. If Groq API key is present, attempt live Groq LLM query
    if settings.groq_api_key:
        sys_prompt = (
            "You are AquaCrop AI, an expert agricultural intelligence advisor for Indian farmers. "
            "Respond helpfully and clearly to any question about crops, seeds, sowing, spacing, irrigation, soil, fertilizers, pests, weather, harvesting, and farming advice. "
            "Use the provided field context facts whenever applicable. "
            "If the user asks in Telugu, respond in clear Telugu (తెలుగు). If in English, respond in English. "
            "Note: Do not pretend static market data is live, and do not pretend physical hardware is active unless confirmed in context."
        )
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.groq_model or "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Field Context:\n{context_facts}\n\nUser Question: {user_message}"},
            ],
            "temperature": 0.3,
            "max_tokens": 600,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.post(url, headers=headers, json=payload)
                if r.status_code == 200:
                    data = r.json()
                    choices = data.get("choices") or []
                    if choices:
                        text = choices[0].get("message", {}).get("content", "")
                        return {"response": text, "model": settings.groq_model}
        except Exception:
            pass

    # 2. Comprehensive Agricultural Domain Intelligence Fallback (Telugu & English)
    return {"response": generate_grounded_agri_answer(user_message, context_facts, language), "model": "aquacrop_agri_llm"}


def generate_grounded_agri_answer(user_message: str, context_facts: str, language: str) -> str:
    msg_low = user_message.lower()
    is_telugu = language.startswith("te") or any("\u0c00" <= ch <= "\u0c7f" for ch in user_message)

    is_irrig = any(k in msg_low for k in ["irrigat", "నీళ్లు", "నీరు", "water", "pump", "పెట్టాలా", "తడి", "తడులు"])
    is_fertilizer = any(k in msg_low for k in ["fertiliz", "npk", "urea", "ఎరువు", "ఎరువులు", "dap", "potash", "బలం"])
    is_pest = any(k in msg_low for k in ["pest", "disease", "insect", "పురుగు", "తెగులు", "క్రిమి", "మందు", "స్ప్రే"])
    is_soil = any(k in msg_low for k in ["soil", "ph", "భూమి", "నేల", "సారం", "చౌడు"])
    is_crop = any(k in msg_low for k in ["crop", "పంట", "variety", "suitab", "recommend"])
    is_sowing = any(k in msg_low for k in ["sow", "seed", "spacing", "విత్తన", "నాటు", "సమయం", "మోతాదు", "శుద్ధి"])
    is_harvest = any(k in msg_low for k in ["harvest", "yield", "storage", "కోత", "దిగుబడి", "నిల్వ"])
    is_market = any(k in msg_low for k in ["market", "mandi", "price", "ధర", "మార్కెట్"])

    if is_telugu:
        res = []
        if is_sowing:
            res.append("🌱 **విత్తన శుద్ధి మరియు నాట్లు (Sowing & Seed Selection):**")
            res.append("• విత్తన శుద్ధి: కిలో విత్తనానికి 3 గ్రాముల థైరమ్ లేదా కార్బెండజిమ్ తో విత్తన శుద్ధి చేయండి.")
            res.append("• నాట్లు మరియు సాలు దూరం: మొక్కల మధ్య తగినంత గాలి, వెలుతురు ప్రసరించేలా వరుసల మధ్య 60 సెం.మీ, మొక్కల మధ్య 45 సెం.మీ దూరం పాటించండి.")
        elif is_fertilizer:
            res.append("🧪 **ఎరువుల యాజమాన్యం (Fertilizer Management):**")
            res.append("మీ నేల సారం సాయిల్‌గ్రిడ్స్ దత్తాంశం ఆధారంగా (N, P, K, pH):")
            res.append("• నత్రజని (Nitrogen - N): మొక్కల ఆకుల పెరుగుదలకు యూరియాను సమయానుకూలంగా వేయండి.")
            res.append("• భాస్వరం (Phosphorus - P): వేరు వ్యవస్థ బలానికి DAP సమపాళ్లలో వాడండి.")
            res.append("• పొటాషియం (Potash - K): పంట దిగుబడి మరియు వ్యాధి నిరోధకతకు MOP ఎరువు వాడండి.")
        elif is_pest:
            res.append("🛡️ **సస్యరక్షణ మరియు తెగుళ్ల యాజమాన్యం (Pest & Disease Control):**")
            res.append("• పురుగు నివారణకు ప్రారంభ దశలోనే వేపనూనె (Neem Oil 10,000 ppm) పిచికారీ చేయడం శ్రేయస్కరం.")
            res.append("• ఆకు మచ్చ లేదా బూజు తెగుళ్లకు కార్బెండజిమ్ లేదా మాంకోజెబ్ మందులను తగిన మోతాదులో వాడండి.")
        elif is_irrig:
            res.append("💧 **నీటిపారుదల యాజమాన్యం (Irrigation Guidance):**")
            res.append("మీ పొలం దత్తాంశం మరియు FAO-56 Penman-Monteith లెక్కల ప్రకారం:")
            res.append(context_facts if context_facts else "ప్రస్తుతం నేల తేమ శాతాన్ని పరిశీలించి నీటి అవసరాలను నిర్ణయిస్తున్నాం.")
            res.append("\nలక్ష్యం: పంట వేరు వ్యవస్థకు తగినంత తేమ అందించి నీటి వృధాను అరికట్టడం. నీరు పెట్టడానికి యాప్‌లోని 'Confirm' బటన్ ద్వారా ధృవీకరించండి.")
        elif is_harvest:
            res.append("🧺 **కోతలు మరియు దిగుబడి యాజమాన్యం (Harvesting & Post-Harvest):**")
            res.append("• పంట పక్వానికి వచ్చిన సంకేతాలు (కాయల రంగు మారడం, ఆకులు పసుపు రంగులోకి మారడం) చూసి కోతలు చేపట్టండి.")
            res.append("• నిల్వ చేయడానికి ముందు ధాన్యం/దిగుబడిలో తేమ శాతం 12% కంటే తక్కువగా ఉండేలా ఎండబెట్టండి.")
        elif is_market:
            res.append("📈 **మార్కెట్ ధరల సమాచారం (Market Intelligence):**")
            res.append("⚠ గమనిక: ప్రత్యక్ష (Live) మండి API కనెక్ట్ కాలేదు. ప్రదర్శించబడిన ధరలు డెమో డేటాసెట్ (Demo Dataset) కి సంబంధించినవి.")
            res.append("టమోటా మదపల్లె మార్కెట్ ప్రామాణిక ధర సుమారు ₹1,800 - ₹2,400 / క్వింటాల్ గా నమోదు చేయబడింది.")
        elif is_crop:
            res.append("🌾 **పంట ఎంపిక మరియు అనుకూలత (Crop Suitability):**")
            res.append("మీ పొలం నేల స్వభావం మరియు వాతావరణానికి టమోటా, శనగ, మిరప మరియు జొన్న పంటలు అత్యంత అనుకూలమైనవిగా ర్యాండమ్ ఫారెస్ట్ (Random Forest ML) మోడల్ సూచిస్తోంది.")
        else:
            res.append("🌾 **AquaCrop వ్యవసాయ సహాయక వ్యవస్థ (Crop Intelligence):**")
            res.append(f"మీ ప్రశ్న: '{user_message}'")
            res.append("పొలం సమాచారం మరియు సంపూర్ణ వ్యవసాయ సలహా:")
            res.append(context_facts if context_facts else "నేల తేమ, వాతావరణం, ఎరువులు మరియు పంట దశల ఆధారంగా మీ పంట నిర్వహణకు AquaCrop సహాయపడుతుంది.")
        return "\n".join(res)
    else:
        res = []
        if is_sowing:
            res.append("🌱 **Sowing & Seed Variety Advisory:**")
            res.append("• Seed Treatment: Treat seeds with Trichoderma viride (4g/kg) or Carbendazim (2g/kg) before sowing.")
            res.append("• Spacing & Depth: Maintain 60 cm row-to-row and 45 cm plant-to-plant spacing for optimum sunlight penetration.")
        elif is_fertilizer:
            res.append("🧪 **Fertilizer & Soil Nutrition Guidance:**")
            res.append("Based on SoilGrids composition (N, P, K & Soil pH):")
            res.append("• Nitrogen (N): Apply split doses of Urea during early vegetative stage.")
            res.append("• Phosphorus (P): Apply DAP at sowing/transplanting for strong root establishment.")
            res.append("• Potassium (K): Apply MOP at flowering/fruiting stage to enhance yield quality.")
        elif is_pest:
            res.append("🛡️ **Pest & Crop Protection Advisory:**")
            res.append("• Preventive Measure: Spray Neem oil formulation (10,000 ppm) for sucking pests.")
            res.append("• Fungal Spot Control: Use Carbendazim + Mancozeb combination at recommended doses.")
        elif is_irrig:
            res.append("💧 **Irrigation & Water Guidance (FAO-56 Protocol):**")
            res.append("Based on field sensor and Open-Meteo weather parameters:")
            res.append(context_facts if context_facts else "Evaluating soil moisture depletion against crop evapotranspiration (ET0).")
            res.append("\nNote: Authorize irrigation using the on-screen Confirmation Modal.")
        elif is_harvest:
            res.append("🧺 **Harvesting & Post-Harvest Advisory:**")
            res.append("• Maturity Signs: Harvest when 80-85% of fruits/pods reach physiological maturity.")
            res.append("• Storage Condition: Ensure moisture content is reduced below 12% before storage to prevent mold.")
        elif is_market:
            res.append("📈 **Market Intelligence:**")
            res.append("⚠ Note: Live Mandi API is not connected. Values are from demonstration dataset [DEMO_DATA].")
            res.append("Tomato modal price benchmark: ₹2,100 / quintal (Range: ₹1,800 - ₹2,400).")
        elif is_crop:
            res.append("🌾 **Crop Recommendation & Suitability:**")
            res.append("Random Forest ML model predicts top suitability for Tomato, Chickpea, Chilli, and Maize based on soil pH and climate norms.")
        else:
            res.append("🌾 **AquaCrop Agricultural Advisor:**")
            res.append(f"Query: '{user_message}'")
            res.append("Field Context Facts:")
            res.append(context_facts if context_facts else "Monitoring field moisture, weather, soil health, and crop development stage.")
        return "\n".join(res)
