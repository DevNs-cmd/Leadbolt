from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.models.lead import Lead, LeadStatus
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadListResponse,
    LeadQualifyRequest,
    LeadQualifyResponse,
)
from app.services.llm import qualify_lead_with_llm


router = APIRouter(prefix="/leads", tags=["Leads"])


@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    """Create a new lead."""
    existing_lead = db.query(Lead).filter(Lead.email == lead_data.email).first()
    if existing_lead:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A lead with this email already exists",
        )

    lead = Lead(**lead_data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/", response_model=LeadListResponse)
def list_leads(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[LeadStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    sort_by: Optional[str] = Query(None, description="Sort field (name, email, status, created_at, follow_up_date)"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db),
):
    """List leads with pagination, filtering, search, and sorting."""
    query = db.query(Lead)

    # Apply filters
    if status:
        query = query.filter(Lead.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(Lead.name.ilike(search_term), Lead.email.ilike(search_term)))

    # Apply sorting
    sort_mapping = {
        "name": Lead.name,
        "email": Lead.email,
        "status": Lead.status,
        "created_at": Lead.created_at,
        "follow_up_date": Lead.follow_up_date,
    }

    if sort_by and sort_by in sort_mapping:
        sort_column = sort_mapping[sort_by]
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(Lead.created_at.desc())

    # Get total count
    total = query.count()

    # Apply pagination
    leads = query.offset((page - 1) * page_size).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size

    return LeadListResponse(
        leads=leads,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    """Get a single lead by ID."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    return lead


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, lead_data: LeadUpdate, db: Session = Depends(get_db)):
    """Update a lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    if lead_data.email and lead_data.email != lead.email:
        existing = db.query(Lead).filter(Lead.email == lead_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A lead with this email already exists",
            )

    update_data = lead_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    """Delete a lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    db.delete(lead)
    db.commit()


@router.post("/qualify", response_model=LeadQualifyResponse)
async def qualify_lead(request: LeadQualifyRequest, db: Session = Depends(get_db)):
    """Qualify a lead using AI (Groq/OpenAI)."""
    lead = db.query(Lead).filter(Lead.email == request.email).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    qualification_result = await qualify_lead_with_llm(lead, request.message)

    if "qualified" in qualification_result.lower():
        lead.status = LeadStatus.QUALIFIED
    elif "contacted" in qualification_result.lower():
        lead.status = LeadStatus.CONTACTED

    db.commit()
    db.refresh(lead)

    return LeadQualifyResponse(
        lead=lead,
        qualification_result=qualification_result,
        ai_response=qualification_result,
    )