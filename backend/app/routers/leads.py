from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead, LeadScoreHistory
from app.schemas.lead import (
    BatchScoreRequest,
    BatchScoreResponse,
    BatchScoreItem,
    LeadCreate,
    LeadResponse,
    LeadUpdate,
    ScoreBreakdown,
    ScoreResponse,
    ScoreHistoryEntry,
)
from app.services.scoring_service import score_breakdown, score_lead

router = APIRouter(prefix="/leads", tags=["leads"])


def apply_scoring(db: Session, lead: Lead, reason: str = "auto") -> Lead:
    if not lead.id:
        lead.id = str(uuid4())
    previous = lead.score
    score, breakdown, grade = score_lead(lead)
    lead.score = score
    lead.score_breakdown = breakdown
    lead.score_grade = grade
    lead.score_updated_at = datetime.now(timezone.utc)

    if previous != score or previous == 0:
        db.add(
            LeadScoreHistory(
                lead_id=lead.id,
                score=score,
                score_breakdown=breakdown,
                reason=reason,
            )
        )
    return lead


def get_lead_or_404(db: Session, lead_id: str) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("", response_model=LeadResponse, status_code=201)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**payload.model_dump())
    db.add(lead)
    apply_scoring(db, lead, reason="created")
    db.commit()
    db.refresh(lead)
    return lead


@router.get("", response_model=list[LeadResponse])
def list_leads(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    grade: str | None = Query(default=None),
    sort: str = Query(default="-score"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Lead.first_name.ilike(like),
                Lead.last_name.ilike(like),
                Lead.company.ilike(like),
                Lead.email.ilike(like),
                Lead.job_title.ilike(like),
            )
        )
    if status:
        query = query.filter(Lead.status == status)
    if grade:
        query = query.filter(Lead.score_grade == grade)

    if sort.lstrip("-") in {"score", "created_at", "updated_at", "company"}:
        column = getattr(Lead, sort.lstrip("-"))
        query = query.order_by(column.desc() if sort.startswith("-") else column.asc())
    else:
        query = query.order_by(Lead.score.desc())

    return query.offset(offset).limit(limit).all()


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: str, db: Session = Depends(get_db)):
    return get_lead_or_404(db, lead_id)


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: str, payload: LeadUpdate, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    apply_scoring(db, lead, reason="updated")
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    db.delete(lead)
    db.commit()


@router.get("/{lead_id}/score", response_model=ScoreResponse)
def get_lead_score(lead_id: str, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    score, breakdown, grade = score_lead(lead)
    return ScoreResponse(
        lead_id=lead.id,
        score=score,
        grade=grade,
        breakdown=ScoreBreakdown(**breakdown),
    )


@router.get("/{lead_id}/score/breakdown", response_model=ScoreBreakdown)
def get_lead_score_breakdown(lead_id: str, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    return ScoreBreakdown(**score_breakdown(lead))


@router.post("/{lead_id}/score/recalculate", response_model=LeadResponse)
def recalculate_score(lead_id: str, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    apply_scoring(db, lead, reason="manual recalculate")
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}/score/history", response_model=list[ScoreHistoryEntry])
def get_score_history(lead_id: str, db: Session = Depends(get_db)):
    get_lead_or_404(db, lead_id)
    return (
        db.query(LeadScoreHistory)
        .filter(LeadScoreHistory.lead_id == lead_id)
        .order_by(LeadScoreHistory.created_at.desc())
        .all()
    )


@router.post("/score/batch", response_model=BatchScoreResponse)
def batch_score(payload: BatchScoreRequest, db: Session = Depends(get_db)):
    results = []
    for lead_id in payload.lead_ids:
        lead = db.get(Lead, lead_id)
        if not lead:
            results.append(BatchScoreItem(lead_id=lead_id, score=0, grade="", error="Lead not found"))
            continue
        apply_scoring(db, lead, reason="batch recalculate")
        results.append(BatchScoreItem(lead_id=lead.id, score=lead.score, grade=lead.score_grade or ""))
    db.commit()
    return BatchScoreResponse(results=results)
