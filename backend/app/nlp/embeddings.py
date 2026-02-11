from __future__ import annotations

import functools
import math
import os
import re
import unicodedata
import warnings
from dataclasses import dataclass

from app.nlp.ontology import Domain
from app.nlp.types import EvidenceSpan, FindingHit


@dataclass(frozen=True)
class SentenceSpan:
    text: str
    start: int
    end: int  # exclusive


_SENT_SPLIT_RE = re.compile(r"[.!?\n;:]+")
_NEGATORS = (
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
)
_NEG_RE = re.compile(r"\b(" + "|".join(map(re.escape, _NEGATORS)) + r")\b")
_CONTRAST_RE = re.compile(r"\b(mas|porem|entretanto|contudo|todavia)\b")
_ASSESSMENT_RE = re.compile(
    r"\b(objetivo\s+da\s+consulta|necessario\s+descartar|descartar|confirmar|investigacao)\b"
)


def split_sentences(text: str) -> list[SentenceSpan]:
    spans: list[SentenceSpan] = []
    last = 0
    for m in _SENT_SPLIT_RE.finditer(text):
        end = m.end()
        spans.extend(_span_from_slice(text, last, end))
        last = end
    spans.extend(_span_from_slice(text, last, len(text)))
    return spans


def _sentence_is_assessment_goal(sentence: str) -> bool:
    # Heurística para evitar falso positivo quando o sintoma aparece como hipótese/objetivo
    # (ex: "necessário descartar ou confirmar X").
    s = _normalize_for_negation(sentence)
    return bool(_ASSESSMENT_RE.search(s))


def _span_from_slice(text: str, start: int, end: int) -> list[SentenceSpan]:
    raw = text[start:end]
    if not raw.strip():
        return []
    # Trim whitespace but preserve offsets.
    left = 0
    right = len(raw)
    while left < right and raw[left].isspace():
        left += 1
    while right > left and raw[right - 1].isspace():
        right -= 1
    s = start + left
    e = start + right
    return [SentenceSpan(text=text[s:e], start=s, end=e)]


def _cosine(u: list[float], v: list[float]) -> float:
    dot = 0.0
    nu = 0.0
    nv = 0.0
    for a, b in zip(u, v, strict=False):
        dot += a * b
        nu += a * a
        nv += b * b
    if nu <= 0.0 or nv <= 0.0:
        return 0.0
    return dot / (math.sqrt(nu) * math.sqrt(nv))


def _normalize_for_negation(text: str) -> str:
    # Lowercase and strip diacritics for robust negation matching in pt-BR.
    out: list[str] = []
    for ch in text.lower():
        decomposed = unicodedata.normalize("NFD", ch)
        for dch in decomposed:
            if unicodedata.combining(dch):
                continue
            out.append(dch)
    return "".join(out)


def _sentence_is_negated(sentence: str) -> bool:
    """
    Heuristica para pt-BR.

    Importante: reduzir falsos "negated" em construcoes como "nao so ... como tambem ...",
    que nao negam o sintoma (equivale a "não apenas").
    """
    s = _normalize_for_negation(sentence)

    # Se houver contraste ("não X, mas Y"), consideramos negação apenas se existir negador
    # depois do contraste. Isso reduz falsos negativos quando embeddings apontam para o trecho Y.
    cm = _CONTRAST_RE.search(s)
    s_check = s[cm.end() :] if cm else s

    for m in _NEG_RE.finditer(s_check):
        neg = m.group(0)
        after = s_check[m.end() : m.end() + 20]

        if neg == "nao":
            # "nao so/apenas/somente" = "not only" (nao e negacao clinica do achado).
            if re.match(r"^\s*(so|apenas|somente)\b", after):
                continue

        return True
    return False


class EmbeddingProvider:
    def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError


@dataclass
class EmbeddingsDiagnostics:
    had_error: bool = False
    error_type: str | None = None


class SafeEmbeddingProvider(EmbeddingProvider):
    """
    Wrapper que:
    - mantém o contrato `embed(list[str]) -> list[list[float]]`
    - captura falhas em runtime (download do modelo, onnxruntime, etc.)
    - registra diagnóstico para a camada de API emitir warning (sem 500)
    """

    def __init__(self, inner: EmbeddingProvider) -> None:
        self.inner = inner
        self.diagnostics = EmbeddingsDiagnostics()

        # Expor `model_name` quando existir no provider real (útil para prefixos E5).
        if hasattr(inner, "model_name"):
            self.model_name = inner.model_name

    def embed(self, texts: list[str]) -> list[list[float]]:
        try:
            return self.inner.embed(texts)
        except Exception as e:
            self.diagnostics.had_error = True
            self.diagnostics.error_type = type(e).__name__
            return []


class FastEmbedProvider(EmbeddingProvider):
    def __init__(self, *, model_name: str) -> None:
        # Evita poluir logs com um warning específico do fastembed sobre pooling.
        warnings.filterwarnings(
            "ignore",
            message=r".*now uses mean pooling instead of CLS embedding.*",
            category=UserWarning,
        )
        # Evita poluir logs com warning de dependência opcional do urllib3 (não usamos SOCKS).
        warnings.filterwarnings(
            "ignore",
            message=r".*SOCKS support in urllib3 requires.*",
            category=Warning,
        )

        from fastembed import TextEmbedding

        # Lazy model download/cache handled by fastembed.
        self.model_name = model_name
        self._model = TextEmbedding(model_name=model_name)

    def embed(self, texts: list[str]) -> list[list[float]]:
        # fastembed returns an iterator of vectors (often numpy arrays).
        out: list[list[float]] = []
        for vec in self._model.embed(texts):
            if hasattr(vec, "tolist"):
                out.append([float(x) for x in vec.tolist()])
            else:
                out.append([float(x) for x in vec])
        return out


@functools.lru_cache(maxsize=1)
def get_default_provider() -> EmbeddingProvider:
    model_name = os.environ.get(
        "PN_EMBEDDINGS_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )
    return FastEmbedProvider(model_name=model_name)


def extract_findings_embeddings(
    text: str,
    domains: list[Domain],
    *,
    already_found: set[str],
    provider: EmbeddingProvider,
    threshold: float = 0.62,
    margin: float = 0.04,
    strong_threshold: float = 0.78,
) -> list[FindingHit]:
    """
    Fallback semantico: tenta mapear frases a sintomas da ontologia via embeddings.
    - PoC: usa evidencia como a sentenca inteira (com offsets)
    - Nao tenta resolver negacao de forma robusta (limitação conhecida)
    """
    sentences = split_sentences(text)
    if not sentences:
        return []

    def _norm(s: str) -> str:
        return _normalize_for_negation(s)

    # Âncoras para reduzir falsos positivos em textos longos: só compara sintoma com sentenças
    # que tenham alguma pista lexical relacionada.
    anchors: dict[str, tuple[str, ...]] = {
        "contato visual reduzido": ("olhar", "olhos", "contato visual"),
        "dificuldade em iniciar interação": ("iniciar", "interacao", "interagir"),
        "isolamento social": ("isol", "sozinh", "solitari", "retira"),
        "falta de reciprocidade emocional": ("reciproc", "conexao emocional", "emocional"),
        "estereotipias motoras": ("repetit", "estereotip", "balanc", "manipula objetos"),
        "insistência nas mesmas rotinas": ("rotina", "mudanc", "ordem", "regras", "mesmice"),
        "interesses hiperfocados": ("hiperfoc", "tunel", "horas", "pesquis", "assunto especifico"),
        "sensibilidade sensorial": ("sensor", "textur", "ruido", "barulho", "etiquet", "costur"),
        "dificuldade de foco": ("foco", "concentr", "distrai", "distract", "abandona"),
        "agitação motora": ("agit", "motor", "pular", "hiperativ", "nao para"),
        "impulsividade": ("impuls", "interromp", "atravessa", "sem olhar", "proibid"),
        "perda de objetos": ("perde", "objet"),
    }

    norm_sentences = [_norm(s.text) for s in sentences]

    # All symptom labels from ontology.
    symptoms: list[tuple[str, str, str]] = []  # (symptom, domain_id, domain_name)
    for d in domains:
        for s in d.target_symptoms:
            if s in already_found:
                continue
            symptoms.append((s, d.id, d.name))

    if not symptoms:
        return []

    # Some retrieval-optimized models (ex: E5) are trained with prefixes.
    # We only apply when the provider exposes a model name containing "e5".
    model_name = getattr(provider, "model_name", "")
    use_e5_prefix = "e5" in str(model_name).lower()

    sent_texts = [f"passage: {s.text}" if use_e5_prefix else s.text for s in sentences]
    sym_texts = [f"query: {s[0]}" if use_e5_prefix else s[0] for s in symptoms]

    sent_vecs = provider.embed(sent_texts)
    sym_vecs = provider.embed(sym_texts)

    hits: list[FindingHit] = []
    for (symptom, domain_id, domain_name), sv in zip(symptoms, sym_vecs, strict=False):
        candidates = list(range(len(sentences)))
        a = anchors.get(symptom)
        if a:
            candidates = [i for i, s in enumerate(norm_sentences) if any(x in s for x in a)]
            if not candidates:
                candidates = list(range(len(sentences)))

        best_i = -1
        best = 0.0
        second = 0.0
        for i in candidates:
            tv = sent_vecs[i]
            sc = _cosine(sv, tv)
            if sc > best:
                second = best
                best = sc
                best_i = i
            elif sc > second:
                second = sc

        # Conservative filter to reduce false positives:
        # - If score is high enough, accept.
        # - Otherwise, require both threshold and a minimal separation from the runner-up.
        if best_i == -1:
            continue
        if best < threshold:
            continue
        if best < strong_threshold and (best - second) < margin:
            continue

        ss = sentences[best_i]
        if _sentence_is_assessment_goal(ss.text):
            continue
        hits.append(
            FindingHit(
                symptom=symptom,
                domain_id=domain_id,
                domain_name=domain_name,
                score=float(best),
                negated=_sentence_is_negated(ss.text),
                method="embeddings",
                evidence=[EvidenceSpan(quote=ss.text, start=ss.start, end=ss.end)],
            )
        )

    return hits
