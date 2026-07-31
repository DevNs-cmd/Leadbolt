from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead, LeadQualificationHistory
from app.schemas.lead import (
    BatchQualifyItem,
    BatchQualifyRequest,
    BatchQualifyResponse,
    QualificationResponse,
    QualificationResult,
)
from app.services import ai_service

router = APIRouter(prefix="/leads", tags=["qualification"])


def get_lead_or_404(db: Session, lead_id: str) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def _persist_qualification(
    db: Session, lead: Lead, result: dict, created_by: str | None = None
) -> dict:
    lead.qualification_score = result["score"]
    lead.qualification_grade = result["grade"]
    lead.qualification_priority = result["priority"]
    lead.qualification_data = result
    lead.qualification_provider = result.get("provider")
    lead.qualified_at = datetime.now(timezone.utc)
    db.add(
        LeadQualificationHistory(
            lead_id=lead.id,
            qualification_data=result,
            created_by=created_by,
        )
    )
    return result


@router.post("/{lead_id}/qualify", response_model=QualificationResponse)
async def qualify_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    result = await ai_service.qualify_lead(lead)
    _persist_qualification(db, lead, result)
    db.commit()
    db.refresh(lead)
    return QualificationResponse(lead_id=lead.id, result=QualificationResult(**result))


@router.get("/{lead_id}/qualification", response_model=QualificationResponse | None)
def get_qualification(lead_id: str, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    if not lead.qualification_data:
        return None
    return QualificationResponse(
        lead_id=lead.id, result=QualificationResult(**lead.qualification_data)
    )


@router.post("/qualify/batch", response_model=BatchQualifyResponse)
async def qualify_batch(payload: BatchQualifyRequest, db: Session = Depends(get_db)):
    results = []
    for lead_id in payload.lead_ids:
        lead = db.get(Lead, lead_id)
        if not lead:
            results.append(BatchQualifyItem(lead_id=lead_id, error="Lead not found"))
            continue
        result = await ai_service.qualify_lead(lead)
        _persist_qualification(db, lead, result)
        results.append(BatchQualifyItem(lead_id=lead.id, result=QualificationResult(**result)))
    db.commit()
    return BatchQualifyResponse(results=results)
