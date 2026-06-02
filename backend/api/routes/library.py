from fastapi import APIRouter, HTTPException
from backend.rag.corpus import list_corpus_entries, delete_guide

router = APIRouter(prefix="/api/library", tags=["library"])


@router.get("")
async def get_library():
    return list_corpus_entries()


@router.delete("/{guide_id}")
async def remove_from_library(guide_id: str):
    delete_guide(guide_id)
    return {"ok": True}
