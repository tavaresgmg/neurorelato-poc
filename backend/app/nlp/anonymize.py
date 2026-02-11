from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class AnonymizationHit:
    kind: str
    start: int
    end: int
    replacement: str


_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_CPF_RE = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")

# Very permissive for BR phones; PoC only.
_PHONE_RE = re.compile(r"\b(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4})[-\s]?\d{4}\b")

# Common date formats (PoC): 10/02/2026, 10-02-2026, 10/02/26
_DATE_RE = re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b")

# Heuristic for names when preceded by common cues.
_NAME_CUE_RE = re.compile(
    r"\b(?i:(chama-se|chamado|chamada|nome|meu filho|minha filha|paciente))\b"
    r"(?:\s*(?:e|é|:|,)?\s+)"
    r"([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+)?)"
)


def anonymize_text(text: str) -> tuple[str, bool, list[AnonymizationHit]]:
    hits: list[AnonymizationHit] = []

    def sub(rex: re.Pattern[str], replacement: str, kind: str, s: str) -> str:
        def _r(m: re.Match[str]) -> str:
            hits.append(
                AnonymizationHit(
                    kind=kind,
                    start=m.start(),
                    end=m.end(),
                    replacement=replacement,
                )
            )
            return replacement

        return rex.sub(_r, s)

    out = text
    out = sub(_EMAIL_RE, "[EMAIL]", "email", out)
    out = sub(_PHONE_RE, "[TELEFONE]", "phone", out)
    out = sub(_CPF_RE, "[CPF]", "cpf", out)
    out = sub(_DATE_RE, "[DATA]", "date", out)

    def name_replace(m: re.Match[str]) -> str:
        cue = m.group(1)
        hits.append(
            AnonymizationHit(kind="name", start=m.start(2), end=m.end(2), replacement="[PACIENTE]")
        )
        # Keep cue; replace just the name.
        return f"{cue} [PACIENTE]"

    out2 = _NAME_CUE_RE.sub(name_replace, out)
    out = out2

    return out, out != text, hits
