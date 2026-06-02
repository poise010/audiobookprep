"""
Renders a completed guide into a branded PDF using WeasyPrint.
"""
from pathlib import Path
from datetime import datetime
import re

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS

from backend.config import settings

_TEMPLATE_DIR = Path(__file__).parent / "templates"
_jinja = Environment(loader=FileSystemLoader(str(_TEMPLATE_DIR)), autoescape=False)

# Simple markdown-ish → HTML converter (avoids a heavy dependency)
def _md_to_html(text: str) -> str:
    if not text:
        return ""
    lines = text.splitlines()
    html_lines = []
    in_ul = False
    in_table = False

    for line in lines:
        # Headers
        if line.startswith("### "):
            if in_ul: html_lines.append("</ul>"); in_ul = False
            html_lines.append(f"<h3>{line[4:].strip()}</h3>")
        elif line.startswith("## "):
            if in_ul: html_lines.append("</ul>"); in_ul = False
            html_lines.append(f"<h2>{line[3:].strip()}</h2>")
        elif line.startswith("# "):
            if in_ul: html_lines.append("</ul>"); in_ul = False
            html_lines.append(f"<h1>{line[2:].strip()}</h1>")
        # Bullet lists
        elif line.startswith("- ") or line.startswith("* "):
            if not in_ul: html_lines.append("<ul>"); in_ul = True
            html_lines.append(f"<li>{_inline(line[2:].strip())}</li>")
        # Horizontal rule
        elif re.match(r"^---+$", line.strip()):
            if in_ul: html_lines.append("</ul>"); in_ul = False
            html_lines.append("<hr>")
        # Blank line
        elif not line.strip():
            if in_ul: html_lines.append("</ul>"); in_ul = False
            html_lines.append("<br>")
        # Normal paragraph line
        else:
            if in_ul: html_lines.append("</ul>"); in_ul = False
            html_lines.append(f"<p>{_inline(line)}</p>")

    if in_ul:
        html_lines.append("</ul>")

    return "\n".join(html_lines)


def _inline(text: str) -> str:
    # Bold
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # Italic
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    return text


def generate_pdf(job: dict) -> bytes:
    sections = job.get("sections", {})
    pron_entries = job.get("pronunciation_entries", [])

    section_html = {
        key: _md_to_html(data.get("content", ""))
        for key, data in sections.items()
    }

    # Group pronunciation entries by category
    pron_by_category: dict[str, list] = {}
    for entry in pron_entries:
        cat = entry.get("category", "unusual")
        pron_by_category.setdefault(cat, []).append(entry)

    template = _jinja.get_template("guide.html")
    html_content = template.render(
        title=job.get("title", "Untitled"),
        author=job.get("author", ""),
        generated_date=datetime.now().strftime("%B %d, %Y"),
        sections=section_html,
        pron_by_category=pron_by_category,
    )

    pdf_bytes = HTML(string=html_content, base_url=str(_TEMPLATE_DIR)).write_pdf()
    return pdf_bytes
