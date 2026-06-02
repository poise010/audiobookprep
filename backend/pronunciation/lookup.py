"""
Pronunciation verification pipeline.
Priority: Merriam-Webster → Forvo → Behind the Name → unverified
"""
import asyncio
import httpx
from dataclasses import dataclass, field
from backend.config import settings
from backend.pronunciation.extractor import CandidateWord


@dataclass
class PronunciationEntry:
    word: str
    category: str
    phonetic: str = ""
    rhymes_with: str = ""
    audio_url: str = ""
    source: str = "unverified"
    notes: str = ""
    context: str = ""
    verified: bool = False


async def lookup_all(candidates: list[CandidateWord]) -> list[PronunciationEntry]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = [_lookup_one(cand, client) for cand in candidates]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    entries = []
    for result in results:
        if isinstance(result, PronunciationEntry):
            entries.append(result)
        # Silently skip lookup failures — never block pipeline on pronunciation
    return entries


async def _lookup_one(cand: CandidateWord, client: httpx.AsyncClient) -> PronunciationEntry:
    entry = PronunciationEntry(word=cand.word, category=cand.category, context=cand.context)

    # 1. Merriam-Webster
    if settings.mw_api_key:
        mw = await _merriam_webster(cand.word, client)
        if mw:
            entry.phonetic = mw.get("phonetic", "")
            entry.rhymes_with = mw.get("rhymes_with", "")
            entry.source = "merriam-webster"
            entry.verified = True
            return entry

    # 2. Forvo
    if settings.forvo_api_key:
        forvo = await _forvo(cand.word, client)
        if forvo:
            entry.audio_url = forvo.get("audio_url", "")
            entry.phonetic = forvo.get("phonetic", "")
            entry.source = "forvo"
            entry.verified = True
            return entry

    # 3. Behind the Name (only for character names)
    if settings.btn_api_key and cand.category == "character_name":
        btn = await _behind_the_name(cand.word, client)
        if btn:
            entry.phonetic = btn.get("phonetic", "")
            entry.notes = btn.get("notes", "")
            entry.source = "behind-the-name"
            entry.verified = True
            return entry

    entry.notes = "Research before recording"
    return entry


async def _merriam_webster(word: str, client: httpx.AsyncClient) -> dict | None:
    try:
        url = f"https://www.dictionaryapi.com/api/v3/references/collegiate/json/{word}"
        resp = await client.get(url, params={"key": settings.mw_api_key})
        if resp.status_code != 200:
            return None
        data = resp.json()
        if not data or isinstance(data[0], str):
            # MW returns a list of suggestions (strings) if not found
            return None
        entry = data[0]
        hwi = entry.get("hwi", {})
        prs = hwi.get("prs", [])
        if not prs:
            return None
        phonetic = prs[0].get("ipa", "")
        if not phonetic:
            phonetic = prs[0].get("mw", "")
        return {"phonetic": f"/{phonetic}/", "rhymes_with": ""}
    except Exception:
        return None


async def _forvo(word: str, client: httpx.AsyncClient) -> dict | None:
    try:
        url = "https://apifree.forvo.com/action/word-pronunciations/format/json"
        params = {
            "word": word,
            "key": settings.forvo_api_key,
            "language": "en",
            "order": "rate-desc",
            "limit": 1,
        }
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return None
        data = resp.json()
        items = data.get("items", [])
        if not items:
            return None
        item = items[0]
        return {
            "audio_url": item.get("pathmp3", ""),
            "phonetic": "",
        }
    except Exception:
        return None


async def _behind_the_name(word: str, client: httpx.AsyncClient) -> dict | None:
    try:
        url = "https://www.behindthename.com/api/lookup.json"
        params = {"key": settings.btn_api_key, "name": word}
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return None
        data = resp.json()
        # BtN returns name info; extract any pronunciation note if available
        names = data.get("names", [])
        if not names:
            return None
        name_data = names[0]
        # BtN doesn't always provide IPA; extract usage info as notes
        usages = name_data.get("usages", [])
        usage_str = ", ".join(u.get("usage_full", "") for u in usages[:3])
        return {"phonetic": "", "notes": usage_str}
    except Exception:
        return None
