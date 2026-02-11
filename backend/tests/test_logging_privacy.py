from __future__ import annotations

import logging

from app.core.logging import PIIRedactionFilter, redact_pii


def test_redact_pii_replaces_common_tokens() -> None:
    s = "contato joao@example.com cpf 123.456.789-10 tel +55 (11) 91234-5678"
    out = redact_pii(s)
    assert "[EMAIL]" in out
    assert "[CPF]" in out
    assert "[PHONE]" in out


def test_logging_filter_redacts_message_in_place() -> None:
    rec = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="email=%s",
        args=("joao@example.com",),
        exc_info=None,
    )
    flt = PIIRedactionFilter()
    assert flt.filter(rec) is True
    assert rec.msg == "email=%s"
    assert rec.args == ("[EMAIL]",)


def test_logging_filter_does_not_break_uvicorn_access_records() -> None:
    rec = logging.LogRecord(
        name="uvicorn.access",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg='%s - "%s %s HTTP/%s" %d',
        args=("127.0.0.1:123", "GET", "/api/v1/health", "1.1", 200),
        exc_info=None,
    )
    flt = PIIRedactionFilter()
    assert flt.filter(rec) is True
    assert rec.args[0] == "127.0.0.1:123"
