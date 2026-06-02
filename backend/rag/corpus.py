"""
ChromaDB collections for the RAG corpus.
One collection per guide section type.
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.config import settings
from backend.rag.embeddings import embed, embed_batch
from functools import lru_cache

SECTION_KEYS = [
    "plot_summary",
    "character_breakdown",
    "perspective_guide",
    "chapter_summary",
    "pronunciation_guide",
]


@lru_cache(maxsize=1)
def _get_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(
        path=str(settings.chromadb_dir),
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def _collection(section_key: str):
    client = _get_client()
    return client.get_or_create_collection(
        name=section_key,
        metadata={"hnsw:space": "cosine"},
    )


def ingest_guide(
    guide_id: str,
    book_title: str,
    author: str,
    genre: str,
    sections: dict[str, str],
) -> None:
    """Store a completed, humanized guide into the RAG corpus."""
    for section_key, text in sections.items():
        if section_key not in SECTION_KEYS or not text.strip():
            continue
        col = _collection(section_key)
        doc_id = f"{guide_id}_{section_key}"
        embedding = embed(text[:4000])  # embed first 4k chars as representative sample
        col.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[{
                "guide_id": guide_id,
                "book_title": book_title,
                "author": author,
                "genre": genre,
                "section_key": section_key,
            }],
        )


def retrieve_examples(
    query_text: str,
    section_key: str,
    n_results: int = 3,
) -> list[dict]:
    """Retrieve the top-N most similar past guide sections for a given query."""
    if section_key not in SECTION_KEYS:
        return []
    col = _collection(section_key)
    count = col.count()
    if count == 0:
        return []

    n = min(n_results, count)
    query_embedding = embed(query_text[:4000])
    results = col.query(
        query_embeddings=[query_embedding],
        n_results=n,
        include=["documents", "metadatas"],
    )
    examples = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        examples.append({
            "text": doc,
            "book_title": meta.get("book_title", "Unknown"),
            "author": meta.get("author", ""),
            "section_key": section_key,
        })
    return examples


def list_corpus_entries() -> list[dict]:
    """Return all ingested guides (by guide_id, deduped)."""
    seen: dict[str, dict] = {}
    col = _collection("plot_summary")
    results = col.get(include=["metadatas"])
    for meta in results.get("metadatas", []):
        gid = meta.get("guide_id", "")
        if gid not in seen:
            seen[gid] = {
                "guide_id": gid,
                "book_title": meta.get("book_title", ""),
                "author": meta.get("author", ""),
                "genre": meta.get("genre", ""),
            }
    return list(seen.values())


def delete_guide(guide_id: str) -> None:
    """Remove all sections of a guide from the corpus."""
    for section_key in SECTION_KEYS:
        col = _collection(section_key)
        doc_id = f"{guide_id}_{section_key}"
        try:
            col.delete(ids=[doc_id])
        except Exception:
            pass
