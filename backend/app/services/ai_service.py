import json
import logging

import httpx

from app.core.config import settings
from app.models.lead import Lead
from app.services.scoring_service import get_grade, score_lead

logger = logging.getLogger(__name__)

QUALIFICATION_PROMPT = """You are an AI Lead Qualification Assistant for LeadBolt.
Analyze the following lead information and provide:
1. Overall Qualification Score (0-100)
2. BANT Analysis (Budget, Authority, Need, Timeline)
3. Key Strengths & Weaknesses
4. Recommended Actions
5. Qualification Grade (Hot Lead / Warm Lead / Cold Lead / Unqualified)
6. Priority Level (High/Medium/Low)
7. Reasoning

Lead Information:
- Name: {first_name} {last_name}
- Company: {company}
- Job Title: {job_title}
- Industry: {industry}
- Company Size: {company_size}
- Email: {email}
- Engagement:
  - Email opens: {email_opens}
  - Website visits: {website_visits}
  - Content downloads: {content_downloads}
  - Page visits: {page_visits}
  - Time on site (minutes): {time_on_site}
  - Form submissions: {form_submissions}
- Pain Points: {pain_points}
- Budget: {budget}
- Timeline: {timeline}
- Lead Status: {status}

Format as JSON:
{{
  "score": number,
  "grade": string,
  "priority": string,
  "bantAnalysis": {{
    "budget": string,
    "authority": string,
    "need": string,
    "timeline": string
  }},
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[],
  "reasoning": string
}}"""


def build_qualification_prompt(lead: Lead) -> str:
    return QUALIFICATION_PROMPT.format(
        first_name=lead.first_name or "",
        last_name=lead.last_name or "",
        company=lead.company or "",
        job_title=lead.job_title or "",
        industry=lead.industry or "",
        company_size=lead.company_size or "",
        email=lead.email or "",
        email_opens=lead.email_opens,
        website_visits=lead.website_visits,
        content_downloads=lead.content_downloads,
        page_visits=lead.page_visits,
        time_on_site=lead.time_on_site,
        form_submissions=lead.form_submissions,
        pain_points=lead.pain_points or "",
        budget=lead.budget or "",
        timeline=lead.timeline or "",
        status=lead.status or "new",
    )


def _rule_based_qualification(lead: Lead) -> dict:
    score, breakdown, grade = score_lead(lead)
    bant = {
        "budget": lead.budget or "Not stated",
        "authority": lead.authority or "Not stated",
        "need": "Identified" if lead.pain_points else "Not identified",
        "timeline": lead.timeline or "Not stated",
    }
    strengths = []
    weaknesses = []

    if breakdown["profile_completeness"]["points"] >= 15:
        strengths.append("Complete profile with contact details")
    if lead.email_opens > 5:
        strengths.append("High email engagement")
    if lead.website_visits > 10:
        strengths.append("Frequent website activity")
    if lead.pain_points:
        strengths.append("Clear pain points identified")
    if lead.budget and lead.budget.lower() == "high":
        strengths.append("Strong budget indication")
    if lead.authority and lead.authority.lower() in ("c-level", "c_level"):
        strengths.append("Decision maker involved")

    if not lead.company or not lead.job_title:
        weaknesses.append("Missing company or job title context")
    if not lead.pain_points:
        weaknesses.append("No pain points identified")
    if not lead.budget:
        weaknesses.append("Budget unknown")
    if lead.company_size and lead.company_size < 50:
        weaknesses.append("Small company size")

    priority = get_grade(score)["priority"]
    recommendations = [
        "Schedule a discovery call to understand requirements",
        "Share relevant case studies and resources",
        "Follow up with tailored outreach sequence",
    ]

    return {
        "score": score,
        "grade": grade,
        "priority": priority,
        "bantAnalysis": bant,
        "strengths": strengths or ["Profile available for review"],
        "weaknesses": weaknesses or ["Limited behavioral data"],
        "recommendations": recommendations,
        "reasoning": (
            "Fallback rule-based qualification computed from profile completeness, "
            "engagement, BANT criteria, behavioral signals, and company fit."
        ),
    }


def _parse_claude_response(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in response")
    data = json.loads(text[start : end + 1])
    if not isinstance(data, dict) or "score" not in data:
        raise ValueError("Response missing required 'score' field")
    return data


async def _call_claude(prompt: str) -> dict:
    headers = {
        "x-api-key": settings.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": settings.CLAUDE_MODEL,
        "max_tokens": settings.CLAUDE_MAX_TOKENS,
        "temperature": settings.CLAUDE_TEMPERATURE,
        "messages": [{"role": "user", "content": prompt}],
    }
    last_error = None
    for attempt in range(settings.CLAUDE_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=settings.CLAUDE_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    settings.CLAUDE_API_URL, headers=headers, json=payload
                )
                response.raise_for_status()
                data = response.json()
            content = data["content"][0]["text"]
            return _parse_claude_response(content)
        except Exception as exc:  # noqa: BLE001 - retry on any API failure
            last_error = exc
            logger.warning("Claude API attempt %s failed: %s", attempt + 1, exc)
    raise RuntimeError(f"Claude API failed after retries: {last_error}")


async def _call_gemini(prompt: str) -> dict:
    url = settings.GEMINI_API_URL.format(model=settings.GEMINI_MODEL)
    headers = {
        "x-goog-api-key": settings.GEMINI_API_KEY,
        "content-type": "application/json",
    }
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    async with httpx.AsyncClient(timeout=settings.CLAUDE_TIMEOUT_SECONDS) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError(f"Unexpected Gemini response shape: {data}") from exc
    return _parse_claude_response(text)


def resolve_provider() -> str:
    provider = settings.AI_PROVIDER.strip().lower()
    if provider == "claude":
        return "claude"
    if provider == "gemini":
        return "gemini"
    if settings.CLAUDE_API_KEY:
        return "claude"
    if settings.GEMINI_API_KEY:
        return "gemini"
    return "none"


def _available_providers() -> list[str]:
    available = [p for p, key in (("claude", settings.CLAUDE_API_KEY), ("gemini", settings.GEMINI_API_KEY)) if key]
    preferred = settings.AI_PROVIDER.strip().lower()
    if preferred in available:
        available.insert(0, available.pop(available.index(preferred)))
    return available


async def _call_provider(provider: str, prompt: str) -> dict:
    if provider == "gemini":
        return _sanitize_result(await _call_gemini(prompt))
    return _sanitize_result(await _call_claude(prompt))


async def qualify_lead(lead: Lead) -> dict:
    providers = _available_providers()
    if not providers:
        logger.info("No AI provider configured, using rule-based qualification")
        result = _rule_based_qualification(lead)
        result["provider"] = "rule_based"
        result["fallback_reason"] = "No AI provider configured (set CLAUDE_API_KEY or GEMINI_API_KEY)"
        return result

    prompt = build_qualification_prompt(lead)
    errors = []
    for provider in providers:
        try:
            result = await _call_provider(provider, prompt)
            result["provider"] = provider
            return result
        except Exception as exc:  # noqa: BLE001
            logger.warning("AI qualification via %s failed: %s", provider, exc)
            errors.append(f"{provider}: {exc}")

    result = _rule_based_qualification(lead)
    result["provider"] = "rule_based"
    result["fallback_reason"] = "AI API error(s): " + " | ".join(errors)
    return result


def _sanitize_result(result: dict) -> dict:
    score = max(0, min(100, int(result.get("score", 0))))
    grade = result.get("grade") or get_grade(score)["grade"]
    priority = result.get("priority") or get_grade(score)["priority"]
    bant = result.get("bantAnalysis") or {}
    return {
        "score": score,
        "grade": grade,
        "priority": priority,
        "bantAnalysis": {
            "budget": bant.get("budget", ""),
            "authority": bant.get("authority", ""),
            "need": bant.get("need", ""),
            "timeline": bant.get("timeline", ""),
        },
        "strengths": [str(s) for s in (result.get("strengths") or [])],
        "weaknesses": [str(w) for w in (result.get("weaknesses") or [])],
        "recommendations": [str(r) for r in (result.get("recommendations") or [])],
        "reasoning": result.get("reasoning", ""),
    }
