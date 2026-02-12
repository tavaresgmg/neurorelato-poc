from __future__ import annotations

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="PN_", extra="ignore")

    # Default for local dev; in Docker/Heroku, override via PN_DATABASE_URL / DATABASE_URL.
    database_url: str = Field(
        default="postgresql+psycopg://plataformaneuro:plataformaneuro@localhost:5432/plataformaneuro",
        validation_alias=AliasChoices("PN_DATABASE_URL", "DATABASE_URL"),
    )

    @field_validator("database_url")
    @classmethod
    def _normalize_database_url(cls, v: str) -> str:
        # Heroku commonly provides `postgres://` or `postgresql://` without an explicit driver.
        # We normalize to SQLAlchemy + psycopg.
        if v.startswith("postgres://"):
            v = "postgresql://" + v.removeprefix("postgres://")
        if v.startswith("postgresql://") and "+psycopg" not in v:
            v = "postgresql+psycopg://" + v.removeprefix("postgresql://")
        return v

    # Policy toggles for demo/prod-hardening.
    # These flags exist to keep the UI flexible while allowing a "safe default" in hosted demos.
    enable_embeddings_by_default: bool = Field(
        default=False,
        validation_alias=AliasChoices("PN_ENABLE_EMBEDDINGS_BY_DEFAULT"),
    )
    embeddings_warmup: bool = Field(
        default=False,
        validation_alias=AliasChoices("PN_EMBEDDINGS_WARMUP"),
    )


settings = Settings()
