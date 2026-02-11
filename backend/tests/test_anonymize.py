from __future__ import annotations

from app.nlp.anonymize import anonymize_text


def test_anonymize_email_phone_cpf() -> None:
    text = "Email joao@example.com, fone (11) 91234-5678, cpf 123.456.789-10, data 10/02/2026."
    out, changed, hits = anonymize_text(text)
    assert changed is True
    assert "[EMAIL]" in out
    assert "[TELEFONE]" in out
    assert "[CPF]" in out
    assert "[DATA]" in out
    kinds = {h.kind for h in hits}
    assert {"email", "phone", "cpf", "date"}.issubset(kinds)


def test_anonymize_name_by_cue() -> None:
    text = "Meu filho João Pedro tem 7 anos."
    out, changed, hits = anonymize_text(text)
    assert changed is True
    assert "Meu filho [PACIENTE]" in out
    assert any(h.kind == "name" for h in hits)
