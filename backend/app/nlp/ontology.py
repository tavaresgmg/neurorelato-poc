from __future__ import annotations

from dataclasses import dataclass
from typing import Any

DEFAULT_ONTOLOGY_VERSION = "mock-1"
ONTOLOGY_SOURCE = "embedded-json"

MOCK_ONTOLOGY: dict[str, Any] = {
    "dominios_clinicos": [
        {
            "id": "DOM_01",
            "nome": "Comunicação e Interação Social",
            "sintomas_alvo": [
                "contato visual reduzido",
                "dificuldade em iniciar interação",
                "isolamento social",
                "falta de reciprocidade emocional",
            ],
        },
        {
            "id": "DOM_02",
            "nome": "Padrões Restritos e Repetitivos (Rigidez)",
            "sintomas_alvo": [
                "estereotipias motoras",
                "insistência nas mesmas rotinas",
                "interesses hiperfocados",
                "sensibilidade sensorial",
            ],
        },
        {
            "id": "DOM_03",
            "nome": "Desatenção e Hiperatividade",
            "sintomas_alvo": [
                "dificuldade de foco",
                "agitação motora",
                "impulsividade",
                "perda de objetos",
            ],
        },
    ]
}

ONTOLOGIES_BY_VERSION: dict[str, dict[str, Any]] = {
    DEFAULT_ONTOLOGY_VERSION: MOCK_ONTOLOGY,
}


@dataclass(frozen=True)
class Domain:
    id: str
    name: str
    target_symptoms: tuple[str, ...]


def load_domains(ontology: dict[str, Any]) -> list[Domain]:
    domains: list[Domain] = []
    for d in ontology.get("dominios_clinicos", []):
        domains.append(
            Domain(
                id=str(d["id"]),
                name=str(d["nome"]),
                target_symptoms=tuple(d.get("sintomas_alvo", [])),
            )
        )
    return domains


def get_ontology(version: str | None = None) -> tuple[str, dict[str, Any]]:
    if version and version in ONTOLOGIES_BY_VERSION:
        return version, ONTOLOGIES_BY_VERSION[version]
    return DEFAULT_ONTOLOGY_VERSION, ONTOLOGIES_BY_VERSION[DEFAULT_ONTOLOGY_VERSION]
