import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    company: Mapped[str | None] = mapped_column(String(255))
    job_title: Mapped[str | None] = mapped_column(String(255))
    industry: Mapped[str | None] = mapped_column(String(100))
    company_size: Mapped[int | None] = mapped_column(Integer)
    source: Mapped[str | None] = mapped_column(String(100))

    email_opens: Mapped[int] = mapped_column(Integer, default=0)
    website_visits: Mapped[int] = mapped_column(Integer, default=0)
    content_downloads: Mapped[int] = mapped_column(Integer, default=0)
    page_visits: Mapped[int] = mapped_column(Integer, default=0)
    time_on_site: Mapped[int] = mapped_column(Integer, default=0)
    form_submissions: Mapped[int] = mapped_column(Integer, default=0)

    budget: Mapped[str | None] = mapped_column(String(50))
    authority: Mapped[str | None] = mapped_column(String(50))
    pain_points: Mapped[str | None] = mapped_column(Text)
    timeline: Mapped[str | None] = mapped_column(String(50))

    score: Mapped[int] = mapped_column(Integer, default=0)
    score_breakdown: Mapped[dict | None] = mapped_column(JSON)
    score_grade: Mapped[str | None] = mapped_column(String(50))
    score_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    qualification_score: Mapped[int | None] = mapped_column(Integer)
    qualification_grade: Mapped[str | None] = mapped_column(String(50))
    qualification_priority: Mapped[str | None] = mapped_column(String(50))
    qualification_data: Mapped[dict | None] = mapped_column(JSON)
    qualification_provider: Mapped[str | None] = mapped_column(String(50))
    qualified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[str] = mapped_column(String(50), default="new")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    score_history: Mapped[list["LeadScoreHistory"]] = relationship(
        back_populates="lead", cascade="all, delete-orphan", order_by="LeadScoreHistory.created_at.desc()"
    )
    qualification_history: Mapped[list["LeadQualificationHistory"]] = relationship(
        back_populates="lead", cascade="all, delete-orphan", order_by="LeadQualificationHistory.created_at.desc()"
    )

    @property
    def full_name(self) -> str:
        return " ".join(filter(None, [self.first_name, self.last_name])).strip()


class LeadScoreHistory(Base):
    __tablename__ = "lead_score_history"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    lead_id: Mapped[str] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[int] = mapped_column(Integer)
    score_breakdown: Mapped[dict | None] = mapped_column(JSON)
    reason: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    lead: Mapped[Lead] = relationship(back_populates="score_history")


class LeadQualificationHistory(Base):
    __tablename__ = "lead_qualification_history"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    lead_id: Mapped[str] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), index=True
    )
    qualification_data: Mapped[dict | None] = mapped_column(JSON)
    created_by: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    lead: Mapped[Lead] = relationship(back_populates="qualification_history")
