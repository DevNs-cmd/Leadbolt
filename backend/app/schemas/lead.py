from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ScoreComponent(BaseModel):
    points: int
    max: int


class ScoreBreakdown(BaseModel):
    profile_completeness: ScoreComponent
    engagement: ScoreComponent
    bant_criteria: ScoreComponent
    behavioral: ScoreComponent
    company_fit: ScoreComponent


class BantAnalysis(BaseModel):
    budget: str = ""
    authority: str = ""
    need: str = ""
    timeline: str = ""


class QualificationResult(BaseModel):
    score: int = Field(ge=0, le=100)
    grade: str
    priority: str
    bantAnalysis: BantAnalysis
    strengths: list[str] = []
    weaknesses: list[str] = []
    recommendations: list[str] = []
    reasoning: str = ""
    provider: Optional[str] = None
    fallback_reason: Optional[str] = None


class LeadBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[int] = None
    source: Optional[str] = None

    email_opens: int = 0
    website_visits: int = 0
    content_downloads: int = 0
    page_visits: int = 0
    time_on_site: int = 0
    form_submissions: int = 0

    budget: Optional[str] = None
    authority: Optional[str] = None
    pain_points: Optional[str] = None
    timeline: Optional[str] = None

    status: str = "new"


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[int] = None
    source: Optional[str] = None

    email_opens: Optional[int] = None
    website_visits: Optional[int] = None
    content_downloads: Optional[int] = None
    page_visits: Optional[int] = None
    time_on_site: Optional[int] = None
    form_submissions: Optional[int] = None

    budget: Optional[str] = None
    authority: Optional[str] = None
    pain_points: Optional[str] = None
    timeline: Optional[str] = None

    status: Optional[str] = None


class LeadResponse(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    score: int
    score_breakdown: Optional[dict] = None
    score_grade: Optional[str] = None
    score_updated_at: Optional[datetime] = None

    qualification_score: Optional[int] = None
    qualification_grade: Optional[str] = None
    qualification_priority: Optional[str] = None
    qualification_data: Optional[dict] = None
    qualification_provider: Optional[str] = None
    qualified_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    @property
    def full_name(self) -> str:
        return " ".join(filter(None, [self.first_name, self.last_name])).strip()


class ScoreResponse(BaseModel):
    lead_id: str
    score: int
    grade: str
    breakdown: ScoreBreakdown


class BatchScoreRequest(BaseModel):
    lead_ids: list[str]


class BatchScoreItem(BaseModel):
    lead_id: str
    score: int
    grade: str
    error: Optional[str] = None


class BatchScoreResponse(BaseModel):
    results: list[BatchScoreItem]


class BatchQualifyRequest(BaseModel):
    lead_ids: list[str]


class BatchQualifyItem(BaseModel):
    lead_id: str
    result: Optional[QualificationResult] = None
    error: Optional[str] = None


class BatchQualifyResponse(BaseModel):
    results: list[BatchQualifyItem]


class QualificationResponse(BaseModel):
    lead_id: str
    result: QualificationResult


class ScoreHistoryEntry(BaseModel):
    id: str
    lead_id: str
    score: int
    score_breakdown: Optional[dict] = None
    reason: Optional[str] = None
    created_at: datetime


class ScoreDistribution(BaseModel):
    hot: int
    warm: int
    cold: int
    unqualified: int


class ScoringDistributionResponse(BaseModel):
    distribution: ScoreDistribution
    total_leads: int
    avg_score: float


class QualificationTrendPoint(BaseModel):
    date: str
    total: int
    avg_score: Optional[float] = None


class QualificationTrendsResponse(BaseModel):
    trends: list[QualificationTrendPoint]


class DashboardResponse(BaseModel):
    total_leads: int
    avg_score: float
    distribution: ScoreDistribution
    qualified_leads: int
    qualification_rate: float
