"""
Extracts candidate words from manuscript text that a narrator might need pronunciation help with.
Uses spaCy NER + pattern matching + wordfreq filtering.
"""
import re
import unicodedata
from dataclasses import dataclass

try:
    import spacy
    _nlp = spacy.load("en_core_web_sm")
except (ImportError, OSError):
    _nlp = None

try:
    from wordfreq import word_frequency
    def _is_common(word: str) -> bool:
        return word_frequency(word.lower(), "en") > 1e-5
except ImportError:
    def _is_common(word: str) -> bool:
        return len(word) < 6

_STANDARD_CONTRACTIONS = {"don't", "can't", "won't", "it's", "i'm", "you're", "they're", "he's", "she's", "we're"}
_COMMON_ACRONYMS = {"USA", "UK", "FBI", "CIA", "DNA", "NYC", "LA", "AI", "CEO", "UN"}

_UNUSUAL_PATTERN = re.compile(
    r"[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]"  # non-ASCII Latin
    r"|[A-Z][a-z]*[A-Z]"                    # camelCase within a word (D'Arcy style handled separately)
)


@dataclass
class CandidateWord:
    word: str
    category: str  # "character_name" | "place" | "organization" | "foreign" | "unusual"
    context: str   # snippet of surrounding text


def extract_candidates(text: str) -> list[CandidateWord]:
    candidates: dict[str, CandidateWord] = {}

    if _nlp:
        _extract_ner(text, candidates)

    _extract_pattern_based(text, candidates)

    # Filter out clearly common words
    filtered = {
        k: v for k, v in candidates.items()
        if not _is_common(k) or v.category in ("character_name", "place", "organization")
    }

    return list(filtered.values())


def _extract_ner(text: str, candidates: dict[str, CandidateWord]):
    # Process in chunks to avoid spaCy's max length limit
    chunk_size = 100_000
    for start in range(0, len(text), chunk_size):
        chunk = text[start : start + chunk_size]
        doc = _nlp(chunk)
        for ent in doc.ents:
            word = ent.text.strip()
            if not word or len(word) < 2:
                continue
            if word in _COMMON_ACRONYMS:
                continue

            category_map = {
                "PERSON": "character_name",
                "GPE": "place",
                "LOC": "place",
                "ORG": "organization",
                "WORK_OF_ART": "unusual",
                "EVENT": "unusual",
                "LANGUAGE": "foreign",
            }
            category = category_map.get(ent.label_, "unusual")

            # Get surrounding context
            ctx_start = max(0, ent.start_char - 60)
            ctx_end = min(len(chunk), ent.end_char + 60)
            context = "..." + chunk[ctx_start:ctx_end].replace("\n", " ") + "..."

            key = word.lower()
            if key not in candidates:
                candidates[key] = CandidateWord(word=word, category=category, context=context)


def _extract_pattern_based(text: str, candidates: dict[str, CandidateWord]):
    # Non-ASCII Latin characters
    for match in re.finditer(r"\b\w*[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]\w*\b", text, re.IGNORECASE):
        word = match.group()
        key = word.lower()
        if key not in candidates:
            ctx = text[max(0, match.start()-50):match.end()+50].replace("\n", " ")
            candidates[key] = CandidateWord(word=word, category="foreign", context=ctx)

    # Words with apostrophes in unusual positions (D'Arcy, O'Brien, Mc'something)
    for match in re.finditer(r"\b[A-Z][a-z]*'[A-Z][a-z]+\b", text):
        word = match.group()
        key = word.lower()
        if key not in candidates:
            ctx = text[max(0, match.start()-50):match.end()+50].replace("\n", " ")
            candidates[key] = CandidateWord(word=word, category="character_name", context=ctx)

    # Long consonant clusters (5+ consonants without a vowel)
    for match in re.finditer(r"\b\w{4,}\b", text):
        word = match.group()
        vowels = sum(1 for c in word.lower() if c in "aeiou")
        if vowels == 0 or (len(word) > 6 and vowels / len(word) < 0.2):
            key = word.lower()
            if key not in candidates and not _is_common(word):
                ctx = text[max(0, match.start()-50):match.end()+50].replace("\n", " ")
                candidates[key] = CandidateWord(word=word, category="unusual", context=ctx)
