import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"


def load_env() -> None:
    # Load .env from project root
    load_dotenv(dotenv_path=ENV_PATH, override=False)


def get_openai_api_key() -> Optional[str]:
    return os.getenv("OPENAI_API_KEY")


def has_openai_api_key() -> bool:
    return bool(get_openai_api_key())
