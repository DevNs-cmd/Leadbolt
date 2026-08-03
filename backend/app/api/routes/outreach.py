from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from outreach.sender import (
    get_automation_rules,
    get_message_history,
    send_message,
)

router = APIRouter(prefix="/outreach", tags=["Outreach"])


class SendMessageRequest(BaseModel):
    template_id: str
    to: str
    subject: Optional[str] = None
    message: str
    channel: str


@router.post("/send")
def send_outreach_message(request: SendMessageRequest):
    try:
        return send_message(
            to=request.to,
            subject=request.subject or "",
            body=request.message,
            channel=request.channel,
            template_id=request.template_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def outreach_history():
    return get_message_history()


@router.get("/automation")
def outreach_automation():
    return get_automation_rules()