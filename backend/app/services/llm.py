import os
from typing import Optional
from app.models.lead import Lead
from app.core.config import settings


async def qualify_lead_with_llm(lead: Lead, context: Optional[str] = None) -> str:
    """
    Qualify a lead using Groq (Llama 3.3 70B) or OpenAI as fallback.
    Returns a qualification result string.
    """
    prompt = f"""
    You are a lead qualification expert for a B2B sales team.

    Lead Information:
    - Name: {lead.name}
    - Email: {lead.email}
    - Phone: {lead.phone or 'Not provided'}
    - Current Status: {lead.status.value}
    - Follow-up Date: {lead.follow_up_date or 'Not set'}
    - Context from sales rep: {context or 'No additional context provided'}

    Based on this information, provide a brief qualification assessment.
    Respond with ONE of these exact classifications:
    - "Qualified: High potential - strong buying signals"
    - "Qualified: Medium potential - needs nurturing"
    - "Contacted: Left voicemail/email, awaiting response"
    - "Contacted: Connected, scheduling follow-up"
    - "Not Qualified: Wrong decision maker"
    - "Not Qualified: No budget/need"
    - "Not Qualified: Bad timing"

    Then provide a brief 2-3 sentence rationale.
    """

    # Try Groq first
    if settings.groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=settings.groq_api_key)
            response = client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq API error: {e}")

    # Fallback to OpenAI
    if settings.openai_api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI API error: {e}")

    # Fallback: simple rule-based qualification
    return _rule_based_qualification(lead)


def _rule_based_qualification(lead: Lead) -> str:
    """Simple rule-based qualification as fallback."""
    if lead.status == LeadStatus.QUALIFIED:
        return "Qualified: Already qualified"
    elif lead.status == LeadStatus.CONTACTED:
        return "Contacted: Already contacted, awaiting response"
    elif lead.phone and "@" in lead.email:
        return "Qualified: Medium potential - has contact info, needs nurturing"
    else:
        return "Not Qualified: Incomplete contact information"