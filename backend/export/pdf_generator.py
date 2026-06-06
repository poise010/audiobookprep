"""
Renders a completed guide into a branded PDF using WeasyPrint.
"""
from pathlib import Path
from datetime import datetime
import re

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

from backend.config import settings

_TEMPLATE_DIR = Path(__file__).parent / "templates"
_jinja = Environment(loader=FileSystemLoader(str(_TEMPLATE_DIR)), autoescape=False)


def _md_to_html(text: str) -> str:
    """Convert markdown to HTML for PDF rendering."""
    if not text:
        return ""
    lines = text.splitlines()
    html_lines = []
    in_ul = False
    in_ol = False
    ol_counter = 0

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("### "):
            _close_lists(html_lines, in_ul, in_ol)
            in_ul = in_ol = False
            html_lines.append(f"<h3>{_inline(stripped[4:])}</h3>")

        elif stripped.startswith("## "):
            _close_lists(html_lines, in_ul, in_ol)
            in_ul = in_ol = False
            html_lines.append(f"<h2>{_inline(stripped[3:])}</h2>")

        elif stripped.startswith("# "):
            _close_lists(html_lines, in_ul, in_ol)
            in_ul = in_ol = False
            html_lines.append(f"<h1>{_inline(stripped[2:])}</h1>")

        elif re.match(r"^\d+\.\s", stripped):
            if in_ul:
                html_lines.append("</ul>")
                in_ul = False
            if not in_ol:
                html_lines.append("<ol>")
                in_ol = True
            content = re.sub(r"^\d+\.\s+", "", stripped)
            html_lines.append(f"<li>{_inline(content)}</li>")

        elif stripped.startswith("- ") or stripped.startswith("* "):
            if in_ol:
                html_lines.append("</ol>")
                in_ol = False
            if not in_ul:
                html_lines.append("<ul>")
                in_ul = True
            html_lines.append(f"<li>{_inline(stripped[2:])}</li>")

        elif re.match(r"^---+$", stripped):
            _close_lists(html_lines, in_ul, in_ol)
            in_ul = in_ol = False
            html_lines.append("<hr>")

        elif not stripped:
            _close_lists(html_lines, in_ul, in_ol)
            in_ul = in_ol = False

        else:
            _close_lists(html_lines, in_ul, in_ol)
            in_ul = in_ol = False
            html_lines.append(f"<p>{_inline(stripped)}</p>")

    _close_lists(html_lines, in_ul, in_ol)
    return "\n".join(html_lines)


def _close_lists(html_lines: list, in_ul: bool, in_ol: bool) -> None:
    if in_ul:
        html_lines.append("</ul>")
    if in_ol:
        html_lines.append("</ol>")


def _inline(text: str) -> str:
    """Convert inline markdown (bold, italic, code) to HTML."""
    text = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"`(.+?)`", r"<code>\1</code>", text)
    return text


def generate_pdf(job: dict) -> bytes:
    sections = job.get("sections", {})
    pron_entries = job.get("pronunciation_entries", [])

    section_html = {
        key: _md_to_html(data.get("content", ""))
        for key, data in sections.items()
    }

    # Group pronunciation entries by category for the structured table
    cat_order = ["character_name", "place", "organization", "foreign", "unusual"]
    pron_verified: dict[str, list] = {c: [] for c in cat_order}
    pron_unverified: list = []

    for entry in pron_entries:
        cat = entry.get("category", "unusual")
        if entry.get("verified"):
            pron_verified.setdefault(cat, []).append(entry)
        else:
            pron_unverified.append(entry)

    template = _jinja.get_template("guide.html")
    html_content = template.render(
        title=job.get("title", "Untitled"),
        author=job.get("author", ""),
        generated_date=datetime.now().strftime("%B %d, %Y"),
        sections=section_html,
        pron_verified=pron_verified,
        pron_unverified=pron_unverified,
        cat_order=cat_order,
        cat_labels={
            "character_name": "Character Names",
            "place": "Place Names",
            "organization": "Organizations",
            "foreign": "Foreign & Invented Words",
            "unusual": "Unusual English Words",
        },
    )

    pdf_bytes = HTML(string=html_content, base_url=str(_TEMPLATE_DIR)).write_pdf()
    return pdf_bytes
