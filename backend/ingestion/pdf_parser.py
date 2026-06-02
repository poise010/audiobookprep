import re
import pdfplumber
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class Chapter:
    title: str
    index: int
    text: str
    word_count: int = field(init=False)

    def __post_init__(self):
        self.word_count = len(self.text.split())


@dataclass
class ParsedManuscript:
    full_text: str
    chapters: list[Chapter]
    title: str
    word_count: int
    page_count: int

    @property
    def excerpt(self) -> str:
        return self.full_text[:2000]

    @property
    def opening(self) -> str:
        return self.full_text[:5000]


_CHAPTER_RE = re.compile(
    r"^(?:chapter|part|section|prologue|epilogue|act)(?:\s*[\d\w]+)?[:\.\s]*(.{0,60})$",
    re.IGNORECASE,
)


def _is_chapter_heading(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if _CHAPTER_RE.match(stripped):
        return True
    # All-caps short line that looks like a title
    if stripped.isupper() and 2 < len(stripped.split()) <= 8:
        return True
    return False


def parse_pdf(pdf_path: Path) -> ParsedManuscript:
    pages_text: list[str] = []

    with pdfplumber.open(pdf_path) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)

    full_text = "\n".join(pages_text)
    word_count = len(full_text.split())

    chapters = _split_into_chapters(full_text)

    # Try to guess title from first non-empty line
    first_line = next((l.strip() for l in full_text.splitlines() if l.strip()), "Unknown Title")
    title = first_line[:100]

    return ParsedManuscript(
        full_text=full_text,
        chapters=chapters,
        title=title,
        word_count=word_count,
        page_count=page_count,
    )


def _split_into_chapters(text: str) -> list[Chapter]:
    lines = text.splitlines()
    chapters: list[Chapter] = []
    current_title = "Opening"
    current_lines: list[str] = []
    chapter_index = 0

    for line in lines:
        if _is_chapter_heading(line):
            if current_lines:
                body = "\n".join(current_lines).strip()
                if len(body.split()) > 10:  # skip empty/near-empty sections
                    chapters.append(Chapter(title=current_title, index=chapter_index, text=body))
                    chapter_index += 1
            current_title = line.strip()
            current_lines = []
        else:
            current_lines.append(line)

    # Last section
    if current_lines:
        body = "\n".join(current_lines).strip()
        if len(body.split()) > 10:
            chapters.append(Chapter(title=current_title, index=chapter_index, text=body))

    if not chapters:
        # No chapter headings found — treat entire text as one block
        chapters = [Chapter(title="Full Manuscript", index=0, text=text)]
    elif len(chapters) == 1 and chapters[0].title == "Opening":
        # No headings detected — rename to make it clear
        chapters[0] = Chapter(title="Full Manuscript", index=0, text=chapters[0].text)

    return chapters
