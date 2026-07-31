from app.models.lead import Lead
from app.services.scoring_service import (
    calculate_bant,
    calculate_behavioral,
    calculate_company_fit,
    calculate_engagement,
    calculate_profile_completeness,
    get_grade,
    score_breakdown,
    score_lead,
)


def make_lead(**overrides):
    data = {
        "first_name": None,
        "last_name": None,
        "email": None,
        "phone": None,
        "company": None,
        "job_title": None,
        "industry": None,
        "company_size": None,
        "email_opens": 0,
        "website_visits": 0,
        "content_downloads": 0,
        "page_visits": 0,
        "time_on_site": 0,
        "form_submissions": 0,
        "budget": None,
        "authority": None,
        "pain_points": None,
        "timeline": None,
    }
    data.update(overrides)
    return Lead(**data)


class TestProfileCompleteness:
    def test_empty_lead_scores_zero(self):
        assert calculate_profile_completeness(make_lead()) == 0

    def test_full_profile_scores_maximum(self):
        lead = make_lead(
            first_name="Sarah",
            last_name="Chen",
            email="sarah@acme.com",
            phone="+1-415-555-0100",
            company="Acme",
            job_title="VP Sales",
            industry="Software",
        )
        assert calculate_profile_completeness(lead) == 20

    def test_invalid_email_gets_no_points(self):
        lead = make_lead(first_name="A", last_name="B", email="not-an-email")
        assert calculate_profile_completeness(lead) == 4

    def test_missing_first_name_loses_name_points(self):
        lead = make_lead(last_name="Chen", email="s@a.com", phone="1", company="C", job_title="T", industry="I")
        assert calculate_profile_completeness(lead) == 16


class TestEngagement:
    def test_max_engagement(self):
        lead = make_lead(email_opens=6, website_visits=11, content_downloads=4)
        assert calculate_engagement(lead) == 25

    def test_mid_tiers(self):
        lead = make_lead(email_opens=3, website_visits=4, content_downloads=2)
        assert calculate_engagement(lead) == 12

    def test_no_engagement(self):
        assert calculate_engagement(make_lead()) == 0


class TestBant:
    def test_max_bant(self):
        lead = make_lead(
            budget="High",
            authority="C-Level",
            pain_points="pain",
            timeline="Immediate",
        )
        assert calculate_bant(lead) == 30

    def test_mid_bant(self):
        lead = make_lead(budget="Medium", authority="Director", pain_points="p", timeline="1-3mo")
        assert calculate_bant(lead) == 22

    def test_low_bant(self):
        lead = make_lead(budget="Low", authority="Manager", timeline="3-6mo")
        assert calculate_bant(lead) == 8

    def test_empty_bant(self):
        assert calculate_bant(make_lead()) == 0


class TestBehavioral:
    def test_max_behavioral(self):
        lead = make_lead(page_visits=21, time_on_site=6, form_submissions=4)
        assert calculate_behavioral(lead) == 15

    def test_mid_behavioral(self):
        lead = make_lead(page_visits=11, time_on_site=3, form_submissions=2)
        assert calculate_behavioral(lead) == 9

    def test_no_behavioral(self):
        assert calculate_behavioral(make_lead()) == 0


class TestCompanyFit:
    def test_target_industry_and_large_company(self):
        lead = make_lead(industry="Software", company_size=600)
        assert calculate_company_fit(lead) == 10

    def test_non_target_industry(self):
        lead = make_lead(industry="Biotech", company_size=600)
        assert calculate_company_fit(lead) == 5

    def test_small_company_scores_one(self):
        lead = make_lead(industry="Software", company_size=60)
        assert calculate_company_fit(lead) == 6

    def test_no_company_data(self):
        assert calculate_company_fit(make_lead()) == 0


class TestGrades:
    def test_hot_lead(self):
        assert get_grade(100)["grade"] == "Hot Lead"
        assert get_grade(80)["grade"] == "Hot Lead"

    def test_warm_lead(self):
        assert get_grade(79)["grade"] == "Warm Lead"
        assert get_grade(60)["grade"] == "Warm Lead"

    def test_cold_lead(self):
        assert get_grade(59)["grade"] == "Cold Lead"
        assert get_grade(40)["grade"] == "Cold Lead"

    def test_unqualified(self):
        assert get_grade(39)["grade"] == "Unqualified"
        assert get_grade(0)["grade"] == "Unqualified"


class TestScoreLead:
    def test_total_is_capped_at_100(self):
        lead = make_lead(
            first_name="A", last_name="B", email="a@b.com", phone="1",
            company="C", job_title="T", industry="Software",
            email_opens=99, website_visits=99, content_downloads=99,
            page_visits=99, time_on_site=99, form_submissions=99,
            budget="High", authority="C-Level", pain_points="p", timeline="Immediate",
            company_size=9999,
        )
        score, breakdown, grade = score_lead(lead)
        assert score == 100
        assert grade == "Hot Lead"
        assert sum(c["points"] for c in breakdown.values()) == 100

    def test_breakdown_has_all_components(self):
        lead = make_lead()
        breakdown = score_breakdown(lead)
        assert set(breakdown.keys()) == {
            "profile_completeness",
            "engagement",
            "bant_criteria",
            "behavioral",
            "company_fit",
        }
