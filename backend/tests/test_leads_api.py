from app.core.config import settings

LEAD_PAYLOAD = {
    "first_name": "Sarah",
    "last_name": "Chen",
    "email": "sarah@acmecorp.com",
    "phone": "+1-415-555-0134",
    "company": "Acme Corp",
    "job_title": "VP of Sales",
    "industry": "Software",
    "company_size": 1200,
    "source": "Webinar",
    "email_opens": 12,
    "website_visits": 24,
    "content_downloads": 6,
    "page_visits": 45,
    "time_on_site": 18,
    "form_submissions": 4,
    "budget": "High",
    "authority": "C-Level",
    "pain_points": "Manual lead routing slows our sales cycle.",
    "timeline": "Immediate",
    "status": "qualified",
}


class TestLeadScoringApi:
    def test_create_lead_scores_automatically(self, client):
        response = client.post("/api/leads", json=LEAD_PAYLOAD)
        assert response.status_code == 201
        data = response.json()
        assert data["score"] == 100
        assert data["score_grade"] == "Hot Lead"
        assert data["score_breakdown"]["profile_completeness"]["points"] == 20
        assert data["score_breakdown"]["engagement"]["points"] == 25
        assert data["score_breakdown"]["bant_criteria"]["points"] == 30
        assert data["score_breakdown"]["behavioral"]["points"] == 15
        assert data["score_breakdown"]["company_fit"]["points"] == 10

    def test_get_score_endpoint(self, client):
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        response = client.get(f"/api/leads/{lead_id}/score")
        assert response.status_code == 200
        assert response.json()["score"] == 100
        assert response.json()["grade"] == "Hot Lead"

    def test_get_score_breakdown(self, client):
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        response = client.get(f"/api/leads/{lead_id}/score/breakdown")
        assert response.status_code == 200
        assert set(response.json().keys()) == {
            "profile_completeness",
            "engagement",
            "bant_criteria",
            "behavioral",
            "company_fit",
        }

    def test_update_lead_rescores(self, client):
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        response = client.patch(f"/api/leads/{lead_id}", json={"email_opens": 0})
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 90
        assert data["score_grade"] == "Hot Lead"

    def test_recalculate_endpoint(self, client):
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        response = client.post(f"/api/leads/{lead_id}/score/recalculate")
        assert response.status_code == 200
        assert response.json()["score"] == 100

    def test_score_history_recorded_on_create_and_update(self, client):
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        client.patch(f"/api/leads/{lead_id}", json={"email_opens": 0})
        response = client.get(f"/api/leads/{lead_id}/score/history")
        assert response.status_code == 200
        history = response.json()
        assert len(history) == 2
        assert history[0]["score"] == 90

    def test_batch_score(self, client):
        first = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        second = client.post("/api/leads", json={**LEAD_PAYLOAD, "email": "x2@acme.com"}).json()["id"]
        response = client.post(
            "/api/leads/score/batch", json={"lead_ids": [first, second, "missing"]}
        )
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 3
        assert results[2]["error"] == "Lead not found"

    def test_list_leads_with_filters(self, client):
        client.post("/api/leads", json=LEAD_PAYLOAD)
        response = client.get("/api/leads", params={"search": "Sarah"})
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.get("/api/leads", params={"grade": "Hot Lead"})
        assert response.status_code == 200
        assert response.json()[0]["score_grade"] == "Hot Lead"

    def test_get_missing_lead_returns_404(self, client):
        assert client.get("/api/leads/does-not-exist").status_code == 404


class TestQualificationApi:
    def test_qualify_lead_with_rule_based_fallback(self, client, monkeypatch):
        monkeypatch.setattr(settings, "AI_PROVIDER", "auto")
        monkeypatch.setattr(settings, "CLAUDE_API_KEY", "")
        monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        response = client.post(f"/api/leads/{lead_id}/qualify")
        assert response.status_code == 200
        data = response.json()["result"]
        assert data["provider"] == "rule_based"
        assert data["score"] == 100
        assert data["grade"] == "Hot Lead"
        assert set(data["bantAnalysis"].keys()) == {
            "budget",
            "authority",
            "need",
            "timeline",
        }

    def test_get_qualification_after_qualify(self, client):
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        client.post(f"/api/leads/{lead_id}/qualify")
        response = client.get(f"/api/leads/{lead_id}/qualification")
        assert response.status_code == 200
        assert response.json()["lead_id"] == lead_id

    def test_get_qualification_before_qualify_returns_null(self, client):
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        response = client.get(f"/api/leads/{lead_id}/qualification")
        assert response.status_code == 200
        assert response.json() is None

    def test_qualification_history_recorded(self, client):
        lead_id = client.post("/api/leads", json=LEAD_PAYLOAD).json()["id"]
        client.post(f"/api/leads/{lead_id}/qualify")
        response = client.get("/api/analytics/qualification/trends")
        assert response.status_code == 200
        assert len(response.json()["trends"]) == 1


class TestAnalyticsApi:
    def test_dashboard(self, client):
        client.post("/api/leads", json=LEAD_PAYLOAD)
        client.post("/api/leads", json={**LEAD_PAYLOAD, "email": "cold@acme.com", "budget": "Low"})
        response = client.get("/api/analytics/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert data["total_leads"] == 2
        assert data["distribution"]["hot"] == 2

    def test_scoring_distribution(self, client):
        client.post("/api/leads", json=LEAD_PAYLOAD)
        response = client.get("/api/analytics/scoring/distribution")
        assert response.status_code == 200
        data = response.json()
        assert data["total_leads"] == 1
        assert data["distribution"]["hot"] == 1
