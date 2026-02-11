from __future__ import annotations

import logging
import re

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_CPF_RE = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b")
_PHONE_RE = re.compile(
    r"(\+?\d{1,3}\s*)?(\(?\d{2}\)?\s*)?\d{4,5}-?\d{4}\b",
    flags=re.IGNORECASE,
)


def redact_pii(text: str) -> str:
    """
    Redator simples para guardrail de logs.

    Não é um DLP completo. Objetivo: evitar vazamento acidental de PII comum em mensagens de log.
    """
    out = text
    out = _EMAIL_RE.sub("[EMAIL]", out)
    out = _CPF_RE.sub("[CPF]", out)
    out = _PHONE_RE.sub("[PHONE]", out)
    return out


class PIIRedactionFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            # Uvicorn access logs use a special formatter that expects `record.args` intact.
            # Do not touch it, or we can break access logging.
            if record.name == "uvicorn.access":
                return True

            # Redact message template when it is a plain string (keeps %-placeholders).
            if isinstance(record.msg, str):
                record.msg = redact_pii(record.msg)

            # Redact args without forcing message formatting (keeps downstream formatters happy).
            if isinstance(record.args, tuple):
                record.args = tuple(redact_pii(a) if isinstance(a, str) else a for a in record.args)
            elif isinstance(record.args, dict):
                record.args = {
                    k: (redact_pii(v) if isinstance(v, str) else v) for k, v in record.args.items()
                }
        except Exception:
            # Never break logging.
            return True
        return True


_INSTALLED = False


def install_pii_redaction_filters() -> None:
    """
    Best-effort: instala um filtro de redacao de PII em loggers comuns.

    É propositalmente conservador para não interferir com o comportamento da aplicação.
    """
    global _INSTALLED  # noqa: PLW0603
    if _INSTALLED:
        return

    flt = PIIRedactionFilter()

    # Root logger (covers most app loggers).
    logging.getLogger().addFilter(flt)

    # Uvicorn loggers (when running in container/Heroku).
    # Intentionally avoid `uvicorn.access` to not interfere with its AccessFormatter.
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).addFilter(flt)

    _INSTALLED = True
