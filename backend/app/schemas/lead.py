from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.lead import LeadStatus


class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Lead's full name")
    email: EmailStr = Field(..., description="Lead's email address")
    phone: Optional[str] = Field(None, max_length=50, description="Lead's phone number")
    status: LeadStatus = Field(default=LeadStatus.NEW, description="Lead status")
    follow_up_date: Optional[datetime] = Field(None, description="Follow-up date")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    status: Optional[LeadStatus] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)


class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadListResponse(BaseModel):
    leads: list[LeadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class LeadQualifyRequest(BaseModel):
    email: EmailStr
    message: Optional[str] = None


class LeadQualifyResponse(BaseModel):
    lead: LeadResponse
    qualification_result: str
    ai_response: str