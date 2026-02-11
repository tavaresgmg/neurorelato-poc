from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class EvidenceSpan:
    quote: str
    start: int
    end: int  # exclusive


@dataclass(frozen=True)
class FindingHit:
    symptom: str
    domain_id: str
    domain_name: str
    score: float
    negated: bool
    method: str
    evidence: list[EvidenceSpan]


@dataclass(frozen=True)
class GapResult:
    domain_id: str
    domain_name: str
    gap_level: str
    rationale: str
    suggested_questions: list[str]


@dataclass(frozen=True)
class Pattern:
    phrase: str
    score: float
    # If the phrase itself contains a negator (ex: "nao olha nos olhos") it still indicates symptom.
    negation_safe: bool = False
