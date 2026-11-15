from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Medication
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.services.gemini_service import generate_gemini_response
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Care Assistant"])

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_assistant(
    chat_req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with ElderCare Assistant.
    Provides empathetic wellness guidance, medication instruction explanations, and safety reminders.
    Uses Google Gemini API when GEMINI_API_KEY is configured, or an intelligent built-in fallback.
    """
    if not chat_req.message.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty.")

    # Build context from current user profile
    meds = db.query(Medication).filter(Medication.user_id == current_user.id).all()
    med_names = [m.medicine_name for m in meds]
    meds_summary = f"Prescribed medications: {', '.join(med_names)}" if med_names else "No active medications registered."

    context = {
        "name": current_user.name,
        "role": current_user.role,
        "medications_summary": meds_summary,
        **(chat_req.user_context or {})
    }

    history_dicts = [{"role": msg.role, "content": msg.content} for msg in chat_req.history] if chat_req.history else []

    res = await generate_gemini_response(
        message=chat_req.message.strip(),
        history=history_dicts,
        user_context=context
    )

    return AIChatResponse(
        reply=res["reply"],
        is_fallback=res["is_fallback"]
    )
