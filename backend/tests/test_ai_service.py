import asyncio
from unittest.mock import AsyncMock, patch

from app.core.config import settings
from app.models.lead import Lead
from app.services.ai_service import (
    _call_gemini,
    _parse_claude_response,
    _rule_based_qualification,
    _sanitize_result,
    build_qualification_prompt,
    qualify_lead,
    resolve_provider,
)


def make_lead(**overrides):
    data = {
        "first_name": "Sarah",
        "last_name": "Chen",
        "email": "sarah@acme.com",
        "company": "Acme Corp",
        "job_title": "VP Sales",
        "industry": "Software",
        "company_size": 500,
        "email_opens": 8,
        "website_visits": 12,
        "content_downloads": 4,
        "page_visits": 25,
        "time_on_site": 10,
        "form_submissions": 3,
        "budget": "High",
        "authority": "C-Level",
        "pain_points": "Manual lead routing is slow.",
        "timeline": "Immediate",
        "status": "new",
    }
    data.update(overrides)
    return Lead(**data)


class TestPromptBuilding:
    def test_prompt_contains_lead_data(self):
        prompt = build_qualification_prompt(make_lead())
        assert "Sarah" in prompt
        assert "Acme Corp" in prompt
        assert "sarah@acme.com" in prompt
        assert "Manual lead routing is slow." in prompt

    def test_prompt_requests_json(self):
        assert "bantAnalysis" in build_qualification_prompt(make_lead())


class TestParseClaudeResponse:
    def test_parses_plain_json(self):
        content = '{"score": 85, "grade": "Hot Lead", "priority": "High"}'
        result = _parse_claude_response(content)
        assert result["score"] == 85
        assert result["grade"] == "Hot Lead"

    def test_parses_fenced_json(self):
        content = '```json\n{"score": 60, "grade": "Warm Lead"}\n```'
        result = _parse_claude_response(content)
        assert result["score"] == 60

    def test_extracts_json_from_markdown_text(self):
        content = 'Here you go:\n{"score": 40, "grade": "Cold Lead"}\nHope this helps.'
        result = _parse_claude_response(content)
        assert result["score"] == 40

    def test_missing_score_raises(self):
        try:
            _parse_claude_response('{"grade": "Hot Lead"}')
        except ValueError:
            return
        raise AssertionError("Expected ValueError for missing score")


class TestSanitizeResult:
    def test_clamps_score_range(self):
        result = _sanitize_result({"score": 250})
        assert result["score"] == 100
        result = _sanitize_result({"score": -10})
        assert result["score"] == 0

    def test_defaults_grade_and_priority(self):
        result = _sanitize_result({"score": 85})
        assert result["grade"] == "Hot Lead"
        assert result["priority"] == "Immediate"


class TestRuleBasedQualification:
    def test_returns_valid_shape(self):
        result = _rule_based_qualification(make_lead())
        assert 0 <= result["score"] <= 100
        assert result["grade"] in {
            "Hot Lead",
            "Warm Lead",
            "Cold Lead",
            "Unqualified",
        }
        assert set(result["bantAnalysis"]) == {"budget", "authority", "need", "timeline"}
        assert isinstance(result["strengths"], list)
        assert isinstance(result["recommendations"], list)

    def test_high_quality_lead_qualified_hot(self):
        result = _rule_based_qualification(make_lead())
        assert result["score"] >= 80
        assert result["grade"] == "Hot Lead"


class TestQualifyLead:
    def test_falls_back_without_api_key(self):
        with patch.object(settings, "AI_PROVIDER", "auto"):
            with patch.object(settings, "CLAUDE_API_KEY", ""):
                with patch.object(settings, "GEMINI_API_KEY", ""):
                    result = asyncio.run(qualify_lead(make_lead()))
        assert result["provider"] == "rule_based"
        assert 0 <= result["score"] <= 100


class TestProviderResolution:
    def test_auto_prefers_claude(self):
        with patch.object(settings, "AI_PROVIDER", "auto"):
            with patch.object(settings, "CLAUDE_API_KEY", "sk-ant-test"):
                with patch.object(settings, "GEMINI_API_KEY", ""):
                    assert resolve_provider() == "claude"

    def test_auto_prefers_gemini_when_no_claude_key(self):
        with patch.object(settings, "AI_PROVIDER", "auto"):
            with patch.object(settings, "CLAUDE_API_KEY", ""):
                with patch.object(settings, "GEMINI_API_KEY", "gem-test"):
                    assert resolve_provider() == "gemini"

    def test_explicit_gemini_overrides(self):
        with patch.object(settings, "AI_PROVIDER", "gemini"):
            assert resolve_provider() == "gemini"

    def test_none_without_keys(self):
        with patch.object(settings, "AI_PROVIDER", "auto"):
            with patch.object(settings, "CLAUDE_API_KEY", ""):
                with patch.object(settings, "GEMINI_API_KEY", ""):
                    assert resolve_provider() == "none"


class TestGeminiCall:
    def test_parses_gemini_response_shape(self):
        fake_response = {
            "candidates": [
                {"content": {"parts": [{"text": '{"score": 70, "grade": "Warm Lead"}'}]}}
            ]
        }

        class FakeResp:
            def raise_for_status(self):
                return None

            def json(self):
                return fake_response

        with patch.object(settings, "GEMINI_API_KEY", "gem-test"):
            with patch(
                "app.services.ai_service.httpx.AsyncClient"
            ) as mock_client_class:
                mock_client = mock_client_class.return_value
                mock_client.post = AsyncMock(return_value=FakeResp())
                mock_client.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client.__aexit__ = AsyncMock(return_value=False)

                result = asyncio.run(_call_gemini("prompt"))
        assert result["score"] == 70
        assert result["grade"] == "Warm Lead"


class TestCrossProviderFallback:
    def test_tries_gemini_after_claude_fails(self):
        lead = make_lead()
        with patch.object(settings, "AI_PROVIDER", "auto"):
            with patch.object(settings, "CLAUDE_API_KEY", "sk-ant-test"):
                with patch.object(settings, "GEMINI_API_KEY", "gem-test"):
                    with patch(
                        "app.services.ai_service._call_claude",
                        side_effect=RuntimeError("claude down"),
                    ):
                        with patch(
                            "app.services.ai_service._call_gemini",
                            new=AsyncMock(
                                return_value={
                                    "score": 66,
                                    "grade": "Warm Lead",
                                    "bantAnalysis": {},
                                    "strengths": [],
                                    "weaknesses": [],
                                    "recommendations": [],
                                    "reasoning": "r",
                                }
                            ),
                        ) as mock_gemini:
                            result = asyncio.run(qualify_lead(lead))
        assert result["provider"] == "gemini"
        mock_gemini.assert_awaited_once()

    def test_all_providers_fail_falls_back_to_rule_based(self):
        lead = make_lead()
        with patch.object(settings, "AI_PROVIDER", "auto"):
            with patch.object(settings, "CLAUDE_API_KEY", "sk-ant-test"):
                with patch.object(settings, "GEMINI_API_KEY", "gem-test"):
                    with patch(
                        "app.services.ai_service._call_claude",
                        side_effect=RuntimeError("claude down"),
                    ):
                        with patch(
                            "app.services.ai_service._call_gemini",
                            side_effect=RuntimeError("gemini down"),
                        ):
                            result = asyncio.run(qualify_lead(lead))
        assert result["provider"] == "rule_based"
        assert "claude" in result["fallback_reason"]
        assert "gemini" in result["fallback_reason"]
