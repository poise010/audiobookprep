"""
Parallel Claude API generation for all 5 guide sections.
All sections are kicked off simultaneously via asyncio.gather.
"""
import asyncio
import json
import uuid
from pathlib import Path
from datetime import datetime

from anthropic import AsyncAnthropic

from backend.config import settings
from backend.ingestion.pdf_parser import ParsedManuscript
from backend.generation.prompts import (
    build_plot_summary_prompt,
    build_character_breakdown_prompt,
    build_perspective_guide_prompt,
    build_chapter_summary_prompt,
    build_pronunciation_prompt,
)
from backend.rag.corpus import retrieve_examples
from backend.pronunciation.extractor import extract_candidates
from backend.pronunciation.lookup import lookup_all

# Shared async client — one connection pool for all parallel requests
_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

# In-memory job store (sufficient for single-user local app)
_jobs: dict[str, dict] = {}

SECTIONS = [
    "plot_summary",
    "character_breakdown",
    "perspective_guide",
    "chapter_summary",
    "pronunciation_guide",
]


class GenerationError(Exception):
    """A user-facing generation error with a clean, actionable message."""
    pass


def create_job(manuscript: ParsedManuscript, title: str = "", author: str = "") -> dict:
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "title": title or manuscript.title,
        "author": author,
        "word_count": manuscript.word_count,
        "page_count": manuscript.page_count,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "manuscript_text": manuscript.full_text,
        "chapters": [
            {"title": c.title, "index": c.index, "text": c.text}
            for c in manuscript.chapters
        ],
        "sections": {s: {"status": "pending", "content": ""} for s in SECTIONS},
        "pronunciation_entries": [],
    }
    _jobs[job_id] = job
    return job


def get_job(job_id: str) -> dict | None:
    return _jobs.get(job_id)


def list_jobs() -> list[dict]:
    return [
        {k: v for k, v in job.items() if k != "manuscript_text"}
        for job in sorted(_jobs.values(), key=lambda j: j["created_at"], reverse=True)
    ]


def update_section(job_id: str, section_key: str, content: str) -> bool:
    job = _jobs.get(job_id)
    if not job or section_key not in SECTIONS:
        return False
    job["sections"][section_key]["content"] = content
    return True


async def run_generation(job_id: str) -> None:
    """Background task: runs the full pipeline for a job."""
    job = _jobs.get(job_id)
    if not job:
        return

    try:
        job["status"] = "generating"
        manuscript_text = job["manuscript_text"]
        chapters = job["chapters"]
        query_text = manuscript_text[:3000]

        # Retrieve RAG examples for all sections in parallel
        rag_tasks = {
            s: asyncio.to_thread(retrieve_examples, query_text, s)
            for s in SECTIONS
        }
        rag_results = await asyncio.gather(*rag_tasks.values(), return_exceptions=True)
        rag_context = {}
        for section, result in zip(SECTIONS, rag_results):
            rag_context[section] = result if isinstance(result, list) else []

        # Extract pronunciation candidates
        candidates = await asyncio.to_thread(extract_candidates, manuscript_text)
        pron_entries = await lookup_all(candidates)
        job["pronunciation_entries"] = [
            {
                "word": e.word,
                "category": e.category,
                "phonetic": e.phonetic,
                "rhymes_with": e.rhymes_with,
                "audio_url": e.audio_url,
                "source": e.source,
                "notes": e.notes,
                "context": e.context[:200],
                "verified": e.verified,
            }
            for e in pron_entries
        ]

        # Generate all sections in parallel
        await asyncio.gather(
            _generate_section(job, "plot_summary", manuscript_text, rag_context["plot_summary"]),
            _generate_section(job, "character_breakdown", manuscript_text, rag_context["character_breakdown"]),
            _generate_section(job, "perspective_guide", manuscript_text, rag_context["perspective_guide"]),
            _generate_chapter_summary(job, chapters, rag_context["chapter_summary"]),
            _generate_pronunciation(job, rag_context["pronunciation_guide"]),
        )

        job["status"] = "ready"

    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)


def _append_instructions(user: str, custom_instructions: str) -> str:
    if custom_instructions and custom_instructions.strip():
        return user + (
            "\n\n---\nADDITIONAL INSTRUCTION FROM THE EDITOR (follow this closely, "
            f"without breaking the rules above):\n{custom_instructions.strip()}"
        )
    return user


async def _generate_section(job: dict, section_key: str, manuscript_text: str, rag_examples: list,
                            custom_instructions: str = "") -> None:
    job["sections"][section_key]["status"] = "generating"
    try:
        builders = {
            "plot_summary": build_plot_summary_prompt,
            "character_breakdown": build_character_breakdown_prompt,
            "perspective_guide": build_perspective_guide_prompt,
        }
        system, user = builders[section_key](manuscript_text, rag_examples)
        user = _append_instructions(user, custom_instructions)
        content = await _call_claude(system, user)
        job["sections"][section_key]["content"] = content
        job["sections"][section_key]["status"] = "done"
    except Exception as e:
        job["sections"][section_key]["status"] = "error"
        job["sections"][section_key]["error"] = str(e)


async def _generate_chapter_summary(job: dict, chapters: list[dict], rag_examples: list,
                                    custom_instructions: str = "") -> None:
    job["sections"]["chapter_summary"]["status"] = "generating"
    try:
        # For long books, generate chapter summaries in batches to stay within context
        if len(chapters) > 20:
            parts = []
            batch_size = 10
            for i in range(0, len(chapters), batch_size):
                batch = chapters[i : i + batch_size]
                system, user = build_chapter_summary_prompt(batch, rag_examples if i == 0 else [])
                user = _append_instructions(user, custom_instructions)
                part = await _call_claude(system, user)
                parts.append(part)
            content = "\n\n".join(parts)
        else:
            system, user = build_chapter_summary_prompt(chapters, rag_examples)
            user = _append_instructions(user, custom_instructions)
            content = await _call_claude(system, user)

        job["sections"]["chapter_summary"]["content"] = content
        job["sections"]["chapter_summary"]["status"] = "done"
    except Exception as e:
        job["sections"]["chapter_summary"]["status"] = "error"
        job["sections"]["chapter_summary"]["error"] = str(e)


async def _generate_pronunciation(job: dict, rag_examples: list, custom_instructions: str = "") -> None:
    job["sections"]["pronunciation_guide"]["status"] = "generating"
    try:
        pron_data = job.get("pronunciation_entries", [])
        manuscript_excerpt = job["manuscript_text"][:2000]
        system, user = build_pronunciation_prompt(pron_data, manuscript_excerpt, rag_examples)
        user = _append_instructions(user, custom_instructions)
        content = await _call_claude(system, user)
        job["sections"]["pronunciation_guide"]["content"] = content
        job["sections"]["pronunciation_guide"]["status"] = "done"
    except Exception as e:
        job["sections"]["pronunciation_guide"]["status"] = "error"
        job["sections"]["pronunciation_guide"]["error"] = str(e)


async def _call_claude(system: str, user: str, max_tokens: int = 4096) -> str:
    # Truncate very long manuscripts to Claude's practical limit
    # Opus supports 200k tokens but we keep user message under ~150k tokens (~600k chars)
    if len(user) > 600_000:
        user = user[:600_000] + "\n\n[Manuscript truncated for length]"

    import anthropic

    last_err: Exception | None = None
    for attempt in range(4):
        try:
            message = await _client.messages.create(
                model=settings.claude_model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return message.content[0].text

        except anthropic.BadRequestError as e:
            # Billing, invalid model, oversized input — not retryable. Surface clearly.
            raise GenerationError(_friendly_error(e)) from e
        except anthropic.AuthenticationError as e:
            raise GenerationError(
                "Anthropic API key is invalid or missing. Check ANTHROPIC_API_KEY in your .env file."
            ) from e
        except (anthropic.RateLimitError, anthropic.InternalServerError, anthropic.APIConnectionError) as e:
            # Transient — retry with exponential backoff (2s, 4s, 8s)
            last_err = e
            if attempt < 3:
                await asyncio.sleep(2 ** (attempt + 1))
                continue
            raise GenerationError(
                "Anthropic API is temporarily unavailable (rate limited or overloaded). "
                "Please try regenerating in a moment."
            ) from e

    raise GenerationError(str(last_err) if last_err else "Unknown generation error")


def _friendly_error(e: "Exception") -> str:
    """Turn raw Anthropic errors into something a non-developer can act on."""
    msg = str(e).lower()
    if "credit balance is too low" in msg or "billing" in msg:
        return (
            "Your Anthropic account is out of credit. Add credit at "
            "console.anthropic.com → Plans & Billing, then regenerate this section."
        )
    if "model" in msg and ("not found" in msg or "invalid" in msg):
        return (
            f"The model '{settings.claude_model}' is not available on your account. "
            "Set CLAUDE_MODEL in your .env (e.g. claude-sonnet-4-6) and restart."
        )
    if "max_tokens" in msg or "too long" in msg or "context" in msg:
        return "This manuscript is too long for a single request. Try a shorter excerpt."
    # Fallback: strip the noisy prefix, keep the human-readable message
    raw = str(e)
    if "'message':" in raw:
        try:
            return raw.split("'message': '")[1].split("'}")[0]
        except Exception:
            pass
    return raw
