"""
Seed the RAG corpus from completed prep guides in the sample_guides/ directory.

Usage:
    python seed_corpus.py

Each file in sample_guides/ should be a plain text or markdown file named:
    BookTitle_Author.txt  (or .md)

The file should contain sections separated by these exact headings:
    ## Plot Summary
    ## Character Breakdown
    ## Perspective Guide
    ## Chapter Summary
    ## Pronunciation Guide

Any sections not found are skipped.
"""
import sys
import re
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from backend.config import settings
from backend.rag.corpus import ingest_guide

SECTION_HEADINGS = {
    "plot_summary": r"##\s*plot\s*summary",
    "character_breakdown": r"##\s*character\s*(breakdown|profiles?)",
    "perspective_guide": r"##\s*perspective\s*(guide)?",
    "chapter_summary": r"##\s*(chapter[\s-]*by[\s-]*chapter|chapter\s*summary)",
    "pronunciation_guide": r"##\s*pronunciation\s*(guide)?",
}


def split_sections(text: str) -> dict[str, str]:
    sections = {}
    heading_pattern = re.compile(r"^##\s+.+$", re.MULTILINE)
    matches = list(heading_pattern.finditer(text))

    for i, match in enumerate(matches):
        heading = match.group()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()

        for key, pattern in SECTION_HEADINGS.items():
            if re.match(pattern, heading, re.IGNORECASE):
                sections[key] = body
                break

    return sections


def ingest_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    sections = split_sections(text)

    if not sections:
        print(f"  ⚠  No recognized sections found in {path.name} — skipping")
        return

    # Parse title/author from filename (BookTitle_Author.txt)
    stem = path.stem
    parts = stem.split("_", 1)
    title = parts[0].replace("-", " ").strip()
    author = parts[1].replace("-", " ").strip() if len(parts) > 1 else ""

    guide_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, stem))

    ingest_guide(
        guide_id=guide_id,
        book_title=title,
        author=author,
        genre="fiction",
        sections=sections,
    )
    section_names = ", ".join(sections.keys())
    print(f"  ✓  Ingested: {title} by {author or '?'} [{section_names}]")


def main():
    sample_dir = settings.sample_guides_dir
    if not sample_dir.exists():
        print(f"Sample guides directory not found: {sample_dir}")
        print("Create it and add .txt or .md files, then run this script again.")
        return

    files = list(sample_dir.glob("*.txt")) + list(sample_dir.glob("*.md"))
    if not files:
        print(f"No .txt or .md files found in {sample_dir}")
        return

    print(f"Ingesting {len(files)} guide(s) into RAG corpus…\n")
    for f in files:
        ingest_file(f)

    print(f"\nDone. {len(files)} guide(s) ingested.")


if __name__ == "__main__":
    main()
