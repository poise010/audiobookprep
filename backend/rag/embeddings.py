"""
Local sentence-transformer embeddings for RAG retrieval.
Model downloads on first use (~80MB), then cached.
"""
from functools import lru_cache

try:
    from sentence_transformers import SentenceTransformer
    _MODEL_NAME = "all-MiniLM-L6-v2"

    @lru_cache(maxsize=1)
    def _get_model() -> SentenceTransformer:
        return SentenceTransformer(_MODEL_NAME)

    def embed(text: str) -> list[float]:
        model = _get_model()
        return model.encode(text, normalize_embeddings=True).tolist()

    def embed_batch(texts: list[str]) -> list[list[float]]:
        model = _get_model()
        return model.encode(texts, normalize_embeddings=True).tolist()

except ImportError:
    # Fallback: zero vector (no-op RAG — corpus is simply not used)
    def embed(text: str) -> list[float]:
        return [0.0] * 384

    def embed_batch(texts: list[str]) -> list[list[float]]:
        return [[0.0] * 384 for _ in texts]
