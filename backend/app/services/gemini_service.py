import os
import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("eldercare.ai")

SYSTEM_INSTRUCTION = """You are "ElderCare Assistant", a kind, patient, and clear artificial intelligence care companion developed for the ElderCare AI platform.
Your purpose is to help elderly people and their caregivers manage daily wellness, understand general healthy habits, understand how to take their prescribed medicines as instructed by their doctor, and navigate the ElderCare platform.

IMPORTANT CLINICAL SAFETY GUIDELINES:
1. NEVER prescribe any medication or treatment.
2. NEVER suggest changing, stopping, or altering any medication dosage or schedule.
3. NEVER diagnose any medical condition, illness, or symptom.
4. ALWAYS remind the user that your guidance is for general informational and wellness support only, and never a substitute for direct advice from their licensed healthcare provider or pharmacist.
5. IN ANY EMERGENCY (severe chest pain, difficulty breathing, sudden weakness, severe fall, fainting, uncontrolled bleeding): Immediately and explicitly instruct the user or caregiver to call local emergency services (such as 911 or local emergency number) or tap the red SOS Emergency button on the ElderCare screen.
6. Tone: Warm, reassuring, respectful, easy to understand, using short and clear sentences suitable for seniors. Avoid confusing medical jargon; explain concepts simply.
7. Explain medication instructions in plain language (e.g., "with food" means having a meal or snack to prevent stomach upset).
"""

FALLBACK_KNOWLEDGE_BASE = [
    {
        "keywords": ["miss", "forgot", "skip", "late"],
        "response": "If you missed a scheduled dose, general healthcare guidelines advise taking it as soon as you remember, unless it is already almost time for your next scheduled dose. Never double up or take two doses at once to make up for a missed one. Please check the specific patient leaflet from your pharmacy or call your doctor or pharmacist to confirm the safest steps for your specific medication."
    },
    {
        "keywords": ["water", "hydrat", "drink", "fluid"],
        "response": "Staying hydrated is very important for seniors! As we age, our natural sense of thirst decreases. A good goal for most adults is sipping 6 to 8 glasses of water throughout the day. Having a glass of water when you take your morning and evening medications is a great routine. If your doctor has put you on a fluid-restricted diet (for example, for heart or kidney care), always follow their specific daily limit."
    },
    {
        "keywords": ["blood pressure", "bp", "hypertension", "systolic", "diastolic"],
        "response": "Blood pressure readings show two numbers: Systolic (the top number, pumping pressure) and Diastolic (the bottom number, resting pressure). For seniors, a common resting target is often around 120/80 mmHg, but your personalized target depends on what your doctor recommends. To get an accurate reading on ElderCare: rest quietly for 5 minutes before measuring, keep your feet flat on the floor, and support your arm at heart level."
    },
    {
        "keywords": ["glucose", "sugar", "diabetes"],
        "response": "Blood glucose tracking helps keep your energy steady. General fasting levels for many adults are between 70 to 130 mg/dL, and under 180 mg/dL two hours after a meal, though your personal targets should be set by your doctor. Always log your readings right after testing so your caregiver and doctor can monitor your health trends."
    },
    {
        "keywords": ["exercise", "walking", "activity", "movement", "fall"],
        "response": "Gentle, regular movement supports heart health, joint flexibility, and balance! Great options include a 15-20 minute daily walk, chair yoga, or gentle stretching. Always wear supportive shoes with non-slip soles, ensure hallways are free of rugs or clutter to prevent falls, and check with your physician before beginning new exercises."
    },
    {
        "keywords": ["sos", "emergency", "help", "pain", "chest", "breath"],
        "response": "If you or your loved one is experiencing severe chest pain, shortness of breath, sudden numbness, or a serious fall, please call emergency services immediately (911 or your local emergency number), or tap the red SOS Emergency button on your ElderCare dashboard to instantly alert your registered caregivers and view emergency contacts!"
    },
    {
        "keywords": ["how to use", "eldercare", "mark", "schedule", "app"],
        "response": "ElderCare AI makes medication tracking simple! On your Elderly Dashboard, you will see 'Today's Medication Schedule'. When it is time to take your medicine, simply click the green 'Mark as Taken' button. The platform records the exact timestamp and updates your caregiver's dashboard automatically in real-time."
    }
]

def get_smart_fallback(user_query: str) -> str:
    query_lower = user_query.lower()
    for item in FALLBACK_KNOWLEDGE_BASE:
        for kw in item["keywords"]:
            if kw in query_lower:
                return (
                    f"{item['response']}\n\n"
                    "*(Note: Powered by ElderCare Assistant offline wellness engine. Configure GEMINI_API_KEY in the backend for live conversational Google Gemini AI.)*"
                )
    
    return (
        "Hello! I am your ElderCare Assistant. I am here to support you with daily wellness tips, "
        "understanding your medication schedule, and maintaining healthy routines.\n\n"
        "Remember to take your prescribed medicines with water at the times set by your doctor, "
        "stay gently active, and log your health numbers regularly. "
        "How can I help you today?\n\n"
        "*(Note: Powered by ElderCare Assistant offline wellness engine. Add your Google Gemini API key to activate full live conversational AI.)*"
    )

async def generate_gemini_response(message: str, history: Optional[List[Dict[str, str]]] = None, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.info("GEMINI_API_KEY not configured. Using intelligent fallback knowledge base.")
        return {
            "reply": get_smart_fallback(message),
            "is_fallback": True
        }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
    
    # Format contents for Gemini REST API
    contents = []
    
    # Add historical messages if provided
    if history:
        for item in history[-6:]: # Keep last 6 exchanges for context window
            role = "user" if item.get("role") in ["user", "human"] else "model"
            contents.append({
                "role": role,
                "parts": [{"text": item.get("content", "")}]
            })
            
    # Add context summary if available (medication count, user role)
    context_prefix = ""
    if user_context:
        role_name = user_context.get("role", "elderly user")
        user_name = user_context.get("name", "User")
        meds_info = user_context.get("medications_summary", "")
        context_prefix = f"[User Context: Name={user_name}, Role={role_name}. {meds_info}]\n"

    contents.append({
        "role": "user",
        "parts": [{"text": f"{context_prefix}{message}"}]
    })

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 800,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "")
                        return {
                            "reply": text,
                            "is_fallback": False
                        }
            logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")

    # Fallback if network issue or invalid key
    return {
        "reply": get_smart_fallback(message),
        "is_fallback": True
    }
