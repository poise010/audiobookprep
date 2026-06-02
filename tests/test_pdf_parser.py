from pathlib import Path
from backend.ingestion.pdf_parser import _split_into_chapters, _is_chapter_heading


def test_chapter_heading_detection():
    assert _is_chapter_heading("Chapter 1")
    assert _is_chapter_heading("CHAPTER ONE")
    assert _is_chapter_heading("Chapter 12: The Storm")
    assert _is_chapter_heading("Part I")
    assert _is_chapter_heading("Prologue")
    assert not _is_chapter_heading("")
    assert not _is_chapter_heading("This is a normal sentence.")


def test_split_chapters_basic():
    text = """Chapter 1
First chapter content here with enough words to pass the minimum. This is a test of the parsing logic.

Chapter 2
Second chapter content here with enough words to pass the minimum. This is a test of the parsing logic."""

    chapters = _split_into_chapters(text)
    assert len(chapters) == 2
    assert chapters[0].title == "Chapter 1"
    assert "First chapter" in chapters[0].text
    assert chapters[1].title == "Chapter 2"


def test_split_no_chapters():
    text = "This is a manuscript with no chapter headings at all. " * 30
    chapters = _split_into_chapters(text)
    assert len(chapters) == 1
    assert chapters[0].title == "Full Manuscript"
