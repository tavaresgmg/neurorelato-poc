from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from app.nlp.embeddings import EmbeddingProvider, extract_findings_embeddings
from app.nlp.ontology import Domain
from app.nlp.types import EvidenceSpan, FindingHit, GapResult, Pattern

NEGATORS = [
    "nao",
    "nunca",
    "jamais",
    "sem",
    "nem",
    "tampouco",
    "nega",
    "negou",
    "negam",
    "negava",
    "negado",
    "negada",
]

_ASSESSMENT_RE = re.compile(
    r"\b("
    r"objetivo\s+da\s+consulta|necessario\s+descartar|descartar|confirmar|investigacao|"
    r"tdah|tea|autismo|transtorno\s+do\s+espectro\s+autista"
    r")\b"
)

_SLEEP_RE = re.compile(r"\b(sono|cama|repouso|adormec|despertar)\b")


SYMPTOM_PATTERNS: dict[str, list[Pattern]] = {
    "contato visual reduzido": [
        Pattern("contato visual reduzido", 0.92),
        Pattern("pouco contato visual", 0.85),
        Pattern("evita contato visual", 0.85),
        Pattern("evita olhar nos olhos", 0.85),
        Pattern("contato visual instrumental", 0.84),
        Pattern("evita o olhar", 0.82),
        Pattern("olhar atraves", 0.8),
        Pattern("olhar perifer", 0.8),
        Pattern("desvia o olhar", 0.8),
        Pattern("nao olha nos olhos", 0.88, negation_safe=True),
    ],
    "dificuldade em iniciar interação": [
        Pattern("dificuldade em iniciar interacao", 0.92),
        Pattern("dificuldade em iniciar interacao social", 0.9),
        Pattern("nao inicia interacao", 0.84, negation_safe=True),
        Pattern("dificuldade para iniciar conversas", 0.82),
        Pattern("demora a iniciar interacao", 0.82),
        Pattern("presenca paralela", 0.78),
        Pattern("nao consegue coordenar as acoes", 0.78),
        Pattern("cooperacao", 0.76),
    ],
    "isolamento social": [
        Pattern("isolamento social", 0.92),
        Pattern("se isola", 0.84),
        Pattern("se isola dos outros", 0.84),
        Pattern("ao isolamento", 0.82),
        Pattern("prefere ficar sozinho", 0.82),
        Pattern("brinca sozinho", 0.82),
        Pattern("atividade solitaria", 0.82),
        Pattern("se retira", 0.78),
        Pattern("nao brinca com outras criancas", 0.82, negation_safe=True),
    ],
    "falta de reciprocidade emocional": [
        Pattern("falta de reciprocidade emocional", 0.92),
        Pattern("pouca reciprocidade emocional", 0.86),
        Pattern("nao responde emocionalmente", 0.82, negation_safe=True),
        Pattern("conexao emocional profunda", 0.82),
        Pattern("evita o olhar em momentos de conexao emocional", 0.82),
        Pattern("falha na pragmatica social", 0.84),
        Pattern("pragmatica social", 0.82),
        Pattern("discurso em trilho", 0.84),
        Pattern("monitorar o interesse do interlocutor", 0.82),
        Pattern("deixas sociais", 0.8),
    ],
    "estereotipias motoras": [
        Pattern("estereotipias motoras", 0.92),
        Pattern("estereotipias", 0.85),
        Pattern("estereotipia", 0.82),
        Pattern("movimentos repetitivos", 0.82),
        Pattern("forma repetitiva", 0.8),
        Pattern("manipula objetos", 0.8),
        Pattern("balanca as maos", 0.8),
        Pattern("balanca o corpo", 0.8),
        Pattern("balancar do tronco", 0.84),
        Pattern("rocking", 0.82),
        Pattern("saltos repetitivos", 0.84),
    ],
    "insistência nas mesmas rotinas": [
        Pattern("insistencia nas mesmas rotinas", 0.92),
        Pattern("insiste nas mesmas rotinas", 0.88),
        Pattern("rigidez com rotinas", 0.84),
        Pattern("fica irritado quando muda a rotina", 0.84),
        Pattern("resiste a mudancas", 0.84),
        Pattern("nao tolera mudanca", 0.84, negation_safe=True),
        Pattern("mudanca na rotina", 0.8),
        Pattern("mudou a rotina", 0.8),
        Pattern("campo minado", 0.78),
        Pattern("quebra dessa ordem", 0.8),
        Pattern("necessidade de controle", 0.78),
        Pattern("nao seguem as regras", 0.8),
        Pattern("quebras na previsibilidade", 0.84),
        Pattern("alteracao de sua rotina", 0.84),
        Pattern("mudancas de planos", 0.8),
        Pattern("rigidez excessiva com rotinas", 0.84),
    ],
    "interesses hiperfocados": [
        Pattern("interesses hiperfocados", 0.92),
        Pattern("interesse hiperfocado", 0.9),
        Pattern("interesses restritos", 0.82),
        Pattern("muito fixado em", 0.78),
        Pattern("interesses muito fixos", 0.82),
        Pattern("muito fixo em", 0.78),
        Pattern("fenomeno de tunel", 0.8),
        Pattern("pesquisando sobre um assunto", 0.82),
        Pattern("passar horas montando", 0.82),
        Pattern("hiperfoco", 0.86),
        Pattern("hiperfoco seletivo", 0.9),
    ],
    "sensibilidade sensorial": [
        Pattern("sensibilidade sensorial", 0.92),
        Pattern("hipersensibilidade", 0.78),
        Pattern("muito sensivel a barulhos", 0.84),
        Pattern("sensivel a ruidos", 0.84),
        Pattern("incomoda com sons", 0.8),
        Pattern("tampa os ouvidos", 0.82),
        Pattern("aversao a texturas", 0.82),
        Pattern("etiquetas e costuras", 0.82),
        Pattern("alta frequencia", 0.78),
        Pattern("ruidos metal", 0.82),
        Pattern("texturas aliment", 0.82),
        Pattern("seletividade", 0.8),
        Pattern("sensibilidade tatil", 0.82),
        Pattern("pressao leve", 0.78),
    ],
    "dificuldade de foco": [
        Pattern("dificuldade de foco", 0.92),
        Pattern("dificuldade de concentracao", 0.86),
        Pattern("nao consegue se concentrar", 0.88, negation_safe=True),
        Pattern("nao mantem a atencao", 0.86, negation_safe=True),
        Pattern("dificuldade para manter a atencao", 0.86),
        Pattern("dificuldade de manter a atencao", 0.86),
        Pattern("perde o foco rapidamente", 0.84),
        Pattern("perde o foco", 0.78),
        Pattern("se distrai com facilidade", 0.82),
        Pattern("distractibilidade", 0.82),
        Pattern("abandona a tarefa", 0.82),
        Pattern("pela metade", 0.78),
        Pattern("distractibilidade exogena", 0.84),
        Pattern("sequestrado", 0.78),
        Pattern("nao finaliza nenhuma", 0.8),
        Pattern("falha em priorizar", 0.82),
        Pattern("mesmo peso", 0.78),
        Pattern("esquecer o que ia fazer", 0.84),
        Pattern("no meio do caminho", 0.8),
        Pattern("esquecendo completamente o objetivo", 0.84),
        Pattern("nao finaliza", 0.8),
        Pattern("chutar respostas", 0.78),
        Pattern("de qualquer jeito", 0.76),
    ],
    "agitação motora": [
        Pattern("agitacao motora", 0.92),
        Pattern("muito agitado", 0.86),
        Pattern("nao para quieto", 0.88, negation_safe=True),
        Pattern("inquieto", 0.82),
        Pattern("hiperativo", 0.84),
        Pattern("hiperatividade", 0.84),
        Pattern("nao consegue ficar sentado", 0.84, negation_safe=True),
        Pattern("comportamento motor exacerbado", 0.84),
        Pattern("comportamento motor se intensifica", 0.84),
        Pattern("nivel de atividade motora", 0.82),
        Pattern("inquietude", 0.78),
        Pattern("correr sem direcao", 0.82),
        Pattern("busca por movimento", 0.84),
        Pattern("balanca as pernas", 0.84),
        Pattern("se contorce", 0.82),
        Pattern("botao de desligar", 0.78),
        Pattern("pressa motora", 0.82),
    ],
    "impulsividade": [
        Pattern("impulsividade", 0.92),
        Pattern("age por impulso", 0.86),
        Pattern("impulsivo", 0.86),
        Pattern("interrompe conversas", 0.82),
        Pattern("interrompe os outros", 0.82),
        Pattern("nao espera sua vez", 0.82, negation_safe=True),
        Pattern("atravessa a rua sem olhar", 0.86),
        Pattern("toca em objetos proibidos", 0.84),
        Pattern("interrompe a fala", 0.84),
        Pattern("baixa tolerancia a espera", 0.84),
        Pattern("postergar gratific", 0.82),
    ],
    "perda de objetos": [
        Pattern("perda de objetos", 0.92),
        Pattern("perde objetos", 0.86),
        Pattern("vive perdendo", 0.78),
        Pattern("perda de pertences", 0.86),
        Pattern("perda constante de pertences", 0.9),
        Pattern("perda constante", 0.78),
        Pattern("perde pertences", 0.84),
    ],
}


GAP_QUESTIONS: dict[str, list[str]] = {
    "DOM_01": [
        "Como está o contato visual durante a interação?",
        "A criança inicia interação espontaneamente?",
        "Existe reciprocidade emocional nas trocas?",
    ],
    "DOM_02": [
        "Há insistência em rotinas específicas?",
        "Existem interesses muito restritos ou hiperfocados?",
        "Há sensibilidade a sons, texturas ou cheiros?",
    ],
    "DOM_03": [
        "Há dificuldade de manter foco em atividades do dia a dia?",
        "Há agitação motora em diferentes contextos?",
        "Há impulsividade (interrompe, age sem pensar)?",
    ],
}


@dataclass(frozen=True)
class NormalizedText:
    original: str
    norm: str
    norm_to_orig: list[int]


def normalize_text(text: str) -> NormalizedText:
    # Lowercase + remove diacritics while keeping an index map to the original.
    norm_chars: list[str] = []
    norm_to_orig: list[int] = []

    for i, ch in enumerate(text):
        # Decompose and drop combining marks.
        decomposed = unicodedata.normalize("NFD", ch)
        for dch in decomposed:
            if unicodedata.combining(dch):
                continue
            norm_chars.append(dch.lower())
            norm_to_orig.append(i)

    return NormalizedText(original=text, norm="".join(norm_chars), norm_to_orig=norm_to_orig)


def _sentence_bounds(norm: str, idx: int) -> tuple[int, int]:
    # Best-effort: find sentence-ish boundaries around a match to detect meta-text
    # like "Objetivo da Consulta: descartar/confirmar...".
    left = idx
    while left > 0 and norm[left - 1] not in ".?!\n;:":
        left -= 1
    right = idx
    while right < len(norm) and norm[right] not in ".?!\n;:":
        right += 1
    return left, right


def _is_assessment_goal_sentence(nt: NormalizedText, start_norm: int) -> bool:
    s0, s1 = _sentence_bounds(nt.norm, start_norm)
    snippet = nt.norm[s0:s1]
    return bool(_ASSESSMENT_RE.search(snippet))


def _is_sleep_context_sentence(nt: NormalizedText, start_norm: int) -> bool:
    s0, s1 = _sentence_bounds(nt.norm, start_norm)
    snippet = nt.norm[s0:s1]
    return bool(_SLEEP_RE.search(snippet))


_neg_re = re.compile(r"\b(" + "|".join(map(re.escape, NEGATORS)) + r")\b")
_contrast_re = re.compile(r"\b(mas|porem|entretanto|contudo|todavia)\b")
_not_only_re = re.compile(r"^nao\s+(so|apenas|somente)\b")


def is_negated(nt: NormalizedText, start_norm: int, end_norm: int, *, pattern: Pattern) -> bool:
    if pattern.negation_safe:
        return False

    # Look back a small window for negation cues.
    lookback_start = max(0, start_norm - 60)
    window = nt.norm[lookback_start:start_norm]

    # Heuristic: if a negator appears near the match, treat as negated.
    matches = list(_neg_re.finditer(window))
    if not matches:
        return False
    # Prefer the closest negator to avoid false negatives when a previous sentence has a negator.
    m = matches[-1]

    # Avoid treating "nao" that is part of the match as negation.
    if start_norm <= m.start() + lookback_start < end_norm:
        return False

    # If negator is too far, ignore.
    distance = start_norm - (m.start() + lookback_start)
    if distance > 40:
        return False

    # Don't let negation cross sentence boundaries (very common false positive).
    neg_abs = lookback_start + m.start()
    between = nt.norm[neg_abs:start_norm]
    if any(ch in between for ch in ".?!\n;:"):
        return False

    # "nao so/apenas/somente ..." = "not only" (doesn't negate the symptom).
    if _not_only_re.match(between):
        return False

    # "nao X, mas Y" => don't negate Y (contrastive conjunction boundary).
    if _contrast_re.search(between):
        return False

    return True


def find_phrase_occurrences(haystack: str, needle: str) -> list[tuple[int, int]]:
    hits: list[tuple[int, int]] = []
    if not needle:
        return hits

    start = 0
    while True:
        idx = haystack.find(needle, start)
        if idx == -1:
            break
        hits.append((idx, idx + len(needle)))
        start = idx + 1
    return hits


def span_to_evidence(nt: NormalizedText, start_norm: int, end_norm: int) -> EvidenceSpan:
    start_orig = nt.norm_to_orig[start_norm]
    end_orig = nt.norm_to_orig[end_norm - 1] + 1
    quote = nt.original[start_orig:end_orig]
    return EvidenceSpan(quote=quote.strip(), start=start_orig, end=end_orig)


def extract_findings(
    text: str,
    domains: list[Domain],
    *,
    embeddings_provider: EmbeddingProvider | None = None,
) -> list[FindingHit]:
    nt = normalize_text(text)

    domain_by_symptom: dict[str, tuple[str, str]] = {}
    for d in domains:
        for s in d.target_symptoms:
            domain_by_symptom[s] = (d.id, d.name)

    hits: list[FindingHit] = []

    for symptom, patterns in SYMPTOM_PATTERNS.items():
        if symptom not in domain_by_symptom:
            continue

        domain_id, domain_name = domain_by_symptom[symptom]

        best_score = 0.0
        best_method = "heuristic"
        evidence_hits: list[tuple[EvidenceSpan, bool]] = []
        has_negated = False
        has_non_negated = False

        for p in patterns:
            for start_norm, end_norm in find_phrase_occurrences(nt.norm, p.phrase):
                if _is_assessment_goal_sentence(nt, start_norm):
                    # Evita falso positivo quando o sintoma aparece como objetivo/hipótese.
                    continue
                if symptom == "agitação motora" and p.phrase in {
                    "muito agitado",
                    "inquieto",
                    "inquietude",
                }:
                    # Evita falso positivo em frases como "sono muito agitado".
                    if _is_sleep_context_sentence(nt, start_norm):
                        continue
                ev = span_to_evidence(nt, start_norm, end_norm)
                best_score = max(best_score, p.score)
                neg = is_negated(nt, start_norm, end_norm, pattern=p)
                evidence_hits.append((ev, neg))
                has_negated = has_negated or neg
                has_non_negated = has_non_negated or (not neg)

        if evidence_hits:
            # If at least one occurrence is non-negated, treat the symptom as present.
            # Otherwise, if all occurrences are negated, mark it as negated.
            negated = has_negated and not has_non_negated

            # Prefer showing non-negated evidence first when the final label is non-negated.
            if not negated:
                evidences = [ev for ev, neg in evidence_hits if not neg] + [
                    ev for ev, neg in evidence_hits if neg
                ]
            else:
                evidences = [ev for ev, _neg in evidence_hits]

            hits.append(
                FindingHit(
                    symptom=symptom,
                    domain_id=domain_id,
                    domain_name=domain_name,
                    score=best_score,
                    negated=negated,
                    method=best_method,
                    evidence=evidences[:3],
                )
            )

    if embeddings_provider is not None:
        try:
            hits.extend(
                extract_findings_embeddings(
                    text,
                    domains,
                    already_found={h.symptom for h in hits},
                    provider=embeddings_provider,
                )
            )
        except Exception:
            # Embeddings are optional; don't fail the request if they fail at runtime.
            pass

    return hits


def compute_gaps(domains: list[Domain], findings: list[FindingHit]) -> list[GapResult]:
    findings_by_domain: dict[str, list[FindingHit]] = {}
    for f in findings:
        findings_by_domain.setdefault(f.domain_id, []).append(f)

    gaps: list[GapResult] = []
    for d in domains:
        domain_all = findings_by_domain.get(d.id, [])
        domain_pos = [f for f in domain_all if not f.negated]
        domain_neg = [f for f in domain_all if f.negated]

        if len(domain_pos) == 0 and len(domain_neg) == 0:
            gap_level = "high"
            rationale = "Nenhuma evidência encontrada para sintomas do domínio."
        elif len(domain_pos) == 0 and len(domain_neg) > 0:
            # Se o domínio foi mencionado apenas em negativas relevantes, não é "zero explorado";
            # ainda pode valer explorar outros sintomas do domínio.
            gap_level = "medium"
            rationale = (
                "Domínio mencionado apenas em negativas relevantes; "
                "pode ser útil explorar outros sintomas."
            )
        elif len(domain_pos) == 1:
            gap_level = "medium"
            rationale = "Pouca evidência encontrada; pode ser necessário explorar mais o domínio."
        else:
            gap_level = "low"
            rationale = "Domínio parcialmente explorado."

        if gap_level in {"high", "medium"}:
            gaps.append(
                GapResult(
                    domain_id=d.id,
                    domain_name=d.name,
                    gap_level=gap_level,
                    rationale=rationale,
                    suggested_questions=GAP_QUESTIONS.get(d.id, [])[:3],
                )
            )

    return gaps
