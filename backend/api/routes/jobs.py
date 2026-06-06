import asyncio
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.responses import JSONResponse, StreamingResponse

from backend.config import settings
from backend.ingestion.pdf_parser import parse_pdf
from backend.generation.generator import (
    create_job, get_job, list_jobs, update_section, run_generation
)
from backend.export.pdf_generator import generate_pdf
from backend.rag.corpus import ingest_guide, SECTION_KEYS

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("")
async def upload_and_create_job(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(""),
    author: str = Form(""),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    # Save uploaded file
    job_id_temp = f"upload_{id(file)}"
    pdf_path = settings.uploads_dir / f"{job_id_temp}.pdf"
    pdf_path.write_bytes(await file.read())

    try:
        manuscript = parse_pdf(pdf_path)
    except Exception as e:
        pdf_path.unlink(missing_ok=True)
        raise HTTPException(422, f"Could not parse PDF: {e}")

    job = create_job(manuscript, title=title, author=author)

    # Rename upload to job_id
    final_path = settings.uploads_dir / f"{job['id']}.pdf"
    pdf_path.rename(final_path)

    background_tasks.add_task(run_generation, job["id"])

    return {
        "job_id": job["id"],
        "title": job["title"],
        "author": job["author"],
        "word_count": job["word_count"],
        "page_count": job["page_count"],
        "status": job["status"],
    }


@router.get("")
async def get_all_jobs():
    return list_jobs()


@router.get("/{job_id}")
async def get_job_detail(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    # Return everything except raw manuscript_text (too large for polling)
    return {k: v for k, v in job.items() if k != "manuscript_text"}


@router.put("/{job_id}/sections/{section_key}")
async def save_section(job_id: str, section_key: str, body: dict):
    if section_key not in SECTION_KEYS:
        raise HTTPException(400, f"Unknown section: {section_key}")
    content = body.get("content", "")
    if not update_section(job_id, section_key, content):
        raise HTTPException(404, "Job not found")
    return {"ok": True}


@router.post("/{job_id}/sections/{section_key}/regenerate")
async def regenerate_section(
    job_id: str,
    section_key: str,
    body: dict,
    background_tasks: BackgroundTasks,
):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if section_key not in SECTION_KEYS:
        raise HTTPException(400, f"Unknown section: {section_key}")

    custom_instructions = body.get("custom_instructions", "")
    job["sections"][section_key]["status"] = "pending"
    job["sections"][section_key]["custom_instructions"] = custom_instructions

    from backend.generation.generator import (
        _generate_section, _generate_chapter_summary, _generate_pronunciation
    )
    from backend.rag.corpus import retrieve_examples

    async def _regen():
        rag = retrieve_examples(job["manuscript_text"][:3000], section_key)
        if section_key == "chapter_summary":
            await _generate_chapter_summary(job, job["chapters"], rag, custom_instructions)
        elif section_key == "pronunciation_guide":
            await _generate_pronunciation(job, rag, custom_instructions)
        else:
            await _generate_section(job, section_key, job["manuscript_text"], rag, custom_instructions)

    background_tasks.add_task(_regen)
    return {"ok": True, "status": "regenerating"}


@router.post("/{job_id}/export")
async def export_pdf(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job["status"] not in ("ready", "exported"):
        raise HTTPException(409, "Guide is not ready for export yet")

    pdf_bytes = generate_pdf(job)
    job["status"] = "exported"

    safe_title = "".join(c for c in job["title"] if c.isalnum() or c in " _-")[:50]
    filename = f"AudiobookPrep_{safe_title}.pdf".replace(" ", "_")

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{job_id}/save-to-corpus")
async def save_to_corpus(job_id: str, body: dict = {}):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    sections = {
        key: data.get("content", "")
        for key, data in job.get("sections", {}).items()
    }
    genre = body.get("genre", "fiction")

    ingest_guide(
        guide_id=job_id,
        book_title=job.get("title", "Unknown"),
        author=job.get("author", ""),
        genre=genre,
        sections=sections,
    )
    return {"ok": True, "message": f"Guide '{job.get('title')}' saved to RAG corpus"}
