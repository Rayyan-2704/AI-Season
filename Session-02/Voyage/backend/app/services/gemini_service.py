import json
from typing import Optional

from groq import Groq

from app.core.config import settings
from app.models.trip import Trip

client = Groq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"

EDITORIAL_SYSTEM_INSTRUCTION = """
You are a senior travel writer for a slow-travel editorial magazine called Voyage.
Your job is to write trip itineraries that read like a thoughtfully written travel
feature — never a bulleted logistics list.

Style rules:
- Write in flowing, evocative prose organized by day.
- Each day should open with a short sense of atmosphere or mood before any specifics.
- Weave in sensory detail (light, sound, smell, texture) alongside practical info.
- Respect the traveler's stated pace: 'relaxed' means fewer stops and more lingering,
  'packed' means an ambitious, energetic day, 'moderate' sits between the two.
- Address the traveler's travel style (e.g. romantic, adventurous, cultural, culinary)
  by shaping the tone and choice of activities accordingly.
- Structure the response with a short trip-level introduction, then one section per day
  labeled clearly (e.g. "Day 1 — [short evocative title]").
- Do not use bullet points or numbered lists. Write in full paragraphs.
- Keep it grounded and specific to the named destination — avoid generic filler.
""".strip()


class GeminiServiceError(Exception):
    """Raised when the AI itinerary generation call fails or returns an unusable response."""
    pass


def _build_generation_prompt(
    trip: Trip,
    pace: str,
    travel_style: Optional[str],
    notes: Optional[str],
) -> str:
    return f"""
Write a narrative travel itinerary for the following trip:

Destination: {trip.destination}
Trip title: {trip.title}
Start date: {trip.start_date}
End date: {trip.end_date}
Pace: {pace}
Travel style: {travel_style or "not specified, use your best editorial judgment"}
Additional traveler notes: {notes or "none"}

Write the full itinerary now, following the style rules exactly.
""".strip()


def _build_regeneration_prompt(
    trip: Trip,
    existing_narrative: str,
    section: Optional[str],
    pace: Optional[str],
    travel_style: Optional[str],
    notes: Optional[str],
) -> str:
    if section:
        return f"""
Here is an existing itinerary for a trip to {trip.destination}:

---
{existing_narrative}
---

Rewrite ONLY the section referred to as "{section}", keeping the rest of the
itinerary's tone and content consistent. Apply these adjustments if relevant:
Pace: {pace or "keep as originally written"}
Travel style: {travel_style or "keep as originally written"}
Additional notes: {notes or "none"}

Return the FULL itinerary text with that one section rewritten in place, not just
the section alone.
""".strip()

    return f"""
Here is an existing itinerary for a trip to {trip.destination}:

---
{existing_narrative}
---

Regenerate the FULL itinerary from scratch with these adjustments:
Pace: {pace or "keep as originally written"}
Travel style: {travel_style or "keep as originally written"}
Additional notes: {notes or "none"}

Follow the same editorial style rules as before.
""".strip()


def _call_groq(prompt: str) -> tuple[str, str]:
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": EDITORIAL_SYSTEM_INSTRUCTION},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
        )

        if not completion.choices or not completion.choices[0].message.content:
            raise GeminiServiceError("Groq returned an empty response")

        narrative_text = completion.choices[0].message.content.strip()
        raw_payload = json.dumps(
            {
                "prompt": prompt,
                "model": GROQ_MODEL,
                "finish_reason": completion.choices[0].finish_reason,
                "usage": completion.usage.model_dump() if completion.usage else None,
            }
        )
        return narrative_text, raw_payload

    except GeminiServiceError:
        raise
    except Exception as e:
        raise GeminiServiceError(f"Groq API call failed: {str(e)}") from e


def generate_itinerary_narrative(
    trip: Trip,
    pace: str,
    travel_style: Optional[str],
    notes: Optional[str],
) -> tuple[str, str]:
    prompt = _build_generation_prompt(trip, pace, travel_style, notes)
    return _call_groq(prompt)


def regenerate_itinerary_narrative(
    trip: Trip,
    existing_narrative: str,
    section: Optional[str],
    pace: Optional[str],
    travel_style: Optional[str],
    notes: Optional[str],
) -> tuple[str, str]:
    prompt = _build_regeneration_prompt(
        trip, existing_narrative, section, pace, travel_style, notes
    )
    return _call_groq(prompt)