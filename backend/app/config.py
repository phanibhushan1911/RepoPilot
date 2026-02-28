from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Mistral AI
    MISTRAL_API_KEY: str = ""
    MISTRAL_LARGE_MODEL: str = "mistral-large-latest"
    CODESTRAL_MODEL: str = "codestral-latest"
    
    # Repository storage
    REPOS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "repos")
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
