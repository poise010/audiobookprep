from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    mw_api_key: str = ""
    forvo_api_key: str = ""
    btn_api_key: str = ""
    claude_model: str = "claude-opus-4-8"

    data_dir: Path = BASE_DIR / "data"
    uploads_dir: Path = BASE_DIR / "uploads"
    exports_dir: Path = BASE_DIR / "exports"
    chromadb_dir: Path = BASE_DIR / "data" / "chromadb"
    guides_dir: Path = BASE_DIR / "data" / "guides"
    sample_guides_dir: Path = BASE_DIR / "sample_guides"

    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"


settings = Settings()

for d in [
    settings.uploads_dir,
    settings.exports_dir,
    settings.chromadb_dir,
    settings.guides_dir,
]:
    d.mkdir(parents=True, exist_ok=True)
