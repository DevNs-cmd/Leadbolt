from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

from outreach.sender import send_message, get_message_history, get_automation_rules

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SendMessageRequest(BaseModel):
    template_id: str
    to: str
    subject: Optional[str] = None
    message: str
    channel: str

leads_db = []

@app.get("/")
async def root():
    return {"message": "LeadBolt API"}

@app.get("/api/health")
async def health():
    return {"status": "OK"}

@app.post("/api/outreach/send")
async def send_outreach_message(request: SendMessageRequest):
    try:
        result = send_message(
            to=request.to,
            subject=request.subject or "",
            body=request.message,
            channel=request.channel,
            template_id=request.template_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/outreach/history")
async def get_outreach_history():
    return get_message_history()

@app.get("/api/outreach/automation")
async def get_automation():
    return get_automation_rules()

@app.get("/api/leads")
async def get_leads():
    return leads_db

@app.post("/api/leads")
async def create_lead(lead: dict):
    lead_id = str(uuid.uuid4())
    lead["id"] = lead_id
    lead["created_at"] = datetime.now().isoformat()
    
    score = 0
    if '@' in lead.get('email', ''): score += 20
    if lead.get('phone'): score += 15
    if lead.get('company'): score += 10
    lead['score'] = min(score, 100)
    
    leads_db.append(lead)
    return {"message": "Lead created", "lead": lead}

@app.get("/api/stats")
async def get_stats():
    total = len(leads_db)
    qualified = len([l for l in leads_db if l.get('score', 0) > 70])
    return {"total": total, "qualified": qualified}