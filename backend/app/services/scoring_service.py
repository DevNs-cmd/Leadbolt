import re

from app.core.config import settings
from app.models.lead import Lead

GRADES = [
    {"min": 80, "grade": "Hot Lead", "color": "#10B981", "priority": "Immediate"},
    {"min": 60, "grade": "Warm Lead", "color": "#F59E0B", "priority": "High"},
    {"min": 40, "grade": "Cold Lead", "color": "#3B82F6", "priority": "Medium"},
    {"min": 0, "grade": "Unqualified", "color": "#6B7280", "priority": "Low"},
]

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

_BUDGET_POINTS = {"high": 8, "medium": 4, "low": 2}
_AUTHORITY_POINTS = {"c-level": 7, "c_level": 7, "director": 5, "manager": 3}
_TIMELINE_POINTS = {
    "immediate": 7,
    "1-3mo": 5,
    "1-3 months": 5,
    "1-3": 5,
    "3-6mo": 3,
    "3-6 months": 3,
    "3-6": 3,
}


def get_grade(score: int) -> dict:
    for grade in GRADES:
        if score >= grade["min"]:
            return grade
    return GRADES[-1]


def _str(value) -> str:
    return (value or "").strip().lower()


def calculate_profile_completeness(lead: Lead) -> int:
    points = 0
    if lead.first_name and lead.last_name:
        points += 4
    if lead.email and _EMAIL_RE.match(lead.email or ""):
        points += 4
    if lead.phone:
        points += 3
    if lead.company:
        points += 3
    if lead.job_title:
        points += 3
    if lead.industry:
        points += 3
    return points


def calculate_engagement(lead: Lead) -> int:
    points = 0
    if lead.email_opens > 5:
        points += 10
    elif lead.email_opens > 2:
        points += 5
    if lead.website_visits > 10:
        points += 8
    elif lead.website_visits > 3:
        points += 4
    if lead.content_downloads > 3:
        points += 7
    elif lead.content_downloads > 1:
        points += 3
    return points


def calculate_bant(lead: Lead) -> int:
    points = 0
    budget = _str(lead.budget)
    points += _BUDGET_POINTS.get(budget, 0)

    authority = _str(lead.authority)
    points += _AUTHORITY_POINTS.get(authority, 0)

    if lead.pain_points:
        points += 8

    timeline = _str(lead.timeline)
    points += _TIMELINE_POINTS.get(timeline, 0)
    return points


def calculate_behavioral(lead: Lead) -> int:
    points = 0
    if lead.page_visits > 20:
        points += 5
    elif lead.page_visits > 10:
        points += 3
    elif lead.page_visits > 5:
        points += 1

    if lead.time_on_site > 5:
        points += 5
    elif lead.time_on_site > 2:
        points += 3
    elif lead.time_on_site > 1:
        points += 1

    if lead.form_submissions > 3:
        points += 5
    elif lead.form_submissions > 1:
        points += 3
    elif lead.form_submissions > 0:
        points += 1
    return points


def calculate_company_fit(lead: Lead) -> int:
    points = 0
    industry = _str(lead.industry)
    if industry and industry in {i.lower() for i in settings.TARGET_INDUSTRIES}:
        points += 5
    if lead.company_size and lead.company_size > 500:
        points += 5
    elif lead.company_size and lead.company_size > 100:
        points += 3
    elif lead.company_size and lead.company_size > 50:
        points += 1
    return points


def score_breakdown(lead: Lead) -> dict:
    return {
        "profile_completeness": {
            "points": calculate_profile_completeness(lead),
            "max": 20,
        },
        "engagement": {
            "points": calculate_engagement(lead),
            "max": 25,
        },
        "bant_criteria": {
            "points": calculate_bant(lead),
            "max": 30,
        },
        "behavioral": {
            "points": calculate_behavioral(lead),
            "max": 15,
        },
        "company_fit": {
            "points": calculate_company_fit(lead),
            "max": 10,
        },
    }


def score_lead(lead: Lead) -> tuple[int, dict, str]:
    breakdown = score_breakdown(lead)
    total = sum(component["points"] for component in breakdown.values())
    total = max(0, min(100, total))
    grade = get_grade(total)["grade"]
    return total, breakdown, grade
