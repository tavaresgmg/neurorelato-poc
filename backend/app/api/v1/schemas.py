from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class NormalizeOptions(BaseModel):
    enable_embeddings: bool = False


class NormalizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)
    options: NormalizeOptions = Field(default_factory=NormalizeOptions)

    @field_validator("text")
    @classmethod
    def _text_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text nao pode ser vazio.")
        return v


class Evidence(BaseModel):
    quote: str
    start: int
    end: int


class Finding(BaseModel):
    symptom: str
    score: float
    negated: bool
    method: str
    evidence: list[Evidence]


class DomainResult(BaseModel):
    domain_id: str
    domain_name: str
    findings: list[Finding]


class Gap(BaseModel):
    domain_id: str
    domain_name: str
    gap_level: str
    rationale: str
    suggested_questions: list[str]


class Summary(BaseModel):
    text: str | None = None
    generated_by: str = "none"


class WarningItem(BaseModel):
    code: str
    message: str


class InputInfo(BaseModel):
    text_length: int
    was_anonymized: bool
    # Só retornamos o texto quando ele for redigido (anonimizado), para reduzir risco de PII.
    redacted_text: str | None = None


class NormalizeResponse(BaseModel):
    request_id: str
    created_at: datetime
    ontology: dict[str, object]
    input: InputInfo
    domains: list[DomainResult]
    gaps: list[Gap]
    summary: Summary
    warnings: list[WarningItem]


class HistoryItem(BaseModel):
    request_id: str
    created_at: datetime
    text_length: int
    findings_count: int
    gaps_count: int
