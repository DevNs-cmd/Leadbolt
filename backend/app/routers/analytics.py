from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead, LeadQualificationHistory, LeadScoreHistory
from app.schemas.lead import (
    DashboardResponse,
    QualificationTrendPoint,
    QualificationTrendsResponse,
    ScoreDistribution,
    ScoringDistributionResponse,
)
from app.services.scoring_service import GRADES

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _distribution(db: Session) -> dict:
    counts = {
        "hot": 0,
        "warm": 0,
        "cold": 0,
        "unqualified": 0,
    }
    rows = (
        db.query(Lead.score_grade, func.count(Lead.id))
        .group_by(Lead.score_grade)
        .all()
    )
    for grade_name, count in rows:
        for grade in GRADES:
            if grade["grade"] == grade_name:
                key = grade["grade"].split()[0].lower()
                if key in counts:
                    counts[key] = count
                break
    return counts


@router.get("/scoring/distribution", response_model=ScoringDistributionResponse)
def scoring_distribution(db: Session = Depends(get_db)):
    distribution = _distribution(db)
    avg = db.query(func.avg(Lead.score)).scalar() or 0
    total = db.query(func.count(Lead.id)).scalar() or 0
    return ScoringDistributionResponse(
        distribution=ScoreDistribution(**distribution),
        total_leads=total,
        avg_score=round(float(avg), 2),
    )


@router.get("/qualification/trends", response_model=QualificationTrendsResponse)
def qualification_trends(days: int = 30, db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(
            func.date(LeadQualificationHistory.created_at).label("day"),
            func.count(LeadQualificationHistory.id),
        )
        .filter(LeadQualificationHistory.created_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    return QualificationTrendsResponse(
        trends=[
            QualificationTrendPoint(date=str(day), total=total) for day, total in rows
        ]
    )


@router.get("/scoring/trends", response_model=list[QualificationTrendPoint])
def scoring_trends(days: int = 30, db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(
            func.date(LeadScoreHistory.created_at).label("day"),
            func.count(LeadScoreHistory.id),
            func.avg(LeadScoreHistory.score),
        )
        .filter(LeadScoreHistory.created_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    return [
        QualificationTrendPoint(date=str(day), total=total, avg_score=round(float(avg), 2))
        for day, total, avg in rows
    ]


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db)):
    distribution = _distribution(db)
    total = db.query(func.count(Lead.id)).scalar() or 0
    avg = db.query(func.avg(Lead.score)).scalar() or 0
    qualified = (
        db.query(func.count(Lead.id))
        .filter(Lead.qualification_score.isnot(None))
        .scalar()
        or 0
    )
    rate = round(qualified / total, 4) if total else 0.0
    return DashboardResponse(
        total_leads=total,
        avg_score=round(float(avg), 2),
        distribution=ScoreDistribution(**distribution),
        qualified_leads=qualified,
        qualification_rate=rate,
    )
