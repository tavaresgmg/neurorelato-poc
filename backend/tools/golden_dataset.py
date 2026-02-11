from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GoldenScenario:
    """
    Dataset pequeno e versionado para benchmark manual (não é gate de CI).

    - required_present: sintomas que *devem* aparecer como não-negados.
    - optional_present: sintomas que, se aparecerem, contam como TP, mas não geram FN se faltarem.
      (útil para testar melhorias sem deixar o benchmark frágil)
    - required_negated: sintomas que devem aparecer como negados.
    """

    name: str
    text: str
    required_present: set[str]
    optional_present: set[str]
    required_negated: set[str]


GOLDEN_SCENARIOS: list[GoldenScenario] = [
    GoldenScenario(
        name="multi-domain-negation",
        text=(
            "Mãe relata que ele não olha nos olhos quando falo. "
            "Na escola, fica irritado quando muda a rotina. "
            "Em casa, é muito agitado e não para quieto. "
            "Nega impulsividade."
        ),
        required_present={
            "contato visual reduzido",
            "insistência nas mesmas rotinas",
            "agitação motora",
        },
        optional_present=set(),
        required_negated={"impulsividade"},
    ),
    GoldenScenario(
        name="social-initiation-isolation-variants",
        text=(
            "A professora relata que ele brinca sozinho e demora a iniciar interação com outras "
            "crianças. Em grupo, prefere ficar sozinho."
        ),
        required_present={"isolamento social", "dificuldade em iniciar interação"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="sensory-variants",
        text=(
            "Queixa de incômodo com sons altos (liquidificador, secador). "
            "Em algumas ocasiões, tampa os ouvidos."
        ),
        required_present={"sensibilidade sensorial"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="attention-variants",
        text=(
            "Na escola, ele perde o foco rapidamente e se distrai com facilidade. "
            "Em casa, tem dificuldade de manter a atenção."
        ),
        required_present={"dificuldade de foco"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="impulsivity-variants",
        text=(
            "A mãe relata que ele por vezes interrompe conversas e não espera sua vez nas "
            "brincadeiras."
        ),
        required_present={"impulsividade"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="objects-loss",
        text="Perde objetos com frequência (lápis, borracha) e vive perdendo materiais da escola.",
        required_present={"perda de objetos"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="objects-loss-negated",
        text="Nega perda de objetos. Segundo a família, não perde objetos com frequência.",
        required_present=set(),
        optional_present=set(),
        required_negated={"perda de objetos"},
    ),
    GoldenScenario(
        name="stereotypies-negated",
        text="Nega estereotipias motoras claras. Não há movimentos repetitivos observados.",
        required_present=set(),
        optional_present=set(),
        required_negated={"estereotipias motoras"},
    ),
    GoldenScenario(
        name="routines-and-hyperfocus",
        text=(
            "Os pais referem irritabilidade quando há mudança na rotina e insistência em "
            "fazer do jeito certo. "
            "Também tem interesses muito fixos por carrinhos e fala longamente sobre o assunto."
        ),
        required_present={"insistência nas mesmas rotinas", "interesses hiperfocados"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="emotional-reciprocity-negated",
        text="Nega falta de reciprocidade emocional marcada; a mãe diz que ele busca colo.",
        required_present=set(),
        optional_present=set(),
        required_negated={"falta de reciprocidade emocional"},
    ),
    GoldenScenario(
        name="hearing-like-phrase-should-not-trigger",
        text=(
            "A mãe diz que às vezes ele 'parece não ouvir' quando é chamado, mas responde quando "
            "o assunto é do interesse dele."
        ),
        required_present=set(),
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="long-mixed-narrative",
        text=(
            "Consulta de seguimento. Na escola, brinca sozinho e demora a iniciar interação. "
            "Em casa, é muito agitado e não para quieto. "
            "Fica incomodado com sons e tampa os ouvidos. "
            "Nega impulsividade grave."
        ),
        required_present={
            "isolamento social",
            "dificuldade em iniciar interação",
            "agitação motora",
            "sensibilidade sensorial",
        },
        optional_present={"contato visual reduzido"},
        required_negated={"impulsividade"},
    ),
    # ---- Cenários adicionais (para chegar ~20 e cobrir mais combinações) ----
    GoldenScenario(
        name="visual-contact-variant",
        text="Evita olhar nos olhos e desvia o olhar durante a conversa.",
        required_present={"contato visual reduzido"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="reciprocity-positive",
        text=(
            "Há pouca reciprocidade emocional e não responde emocionalmente às tentativas de "
            "contato."
        ),
        required_present={"falta de reciprocidade emocional"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="stereotypies-positive",
        text="Foram observados movimentos repetitivos e estereotipias motoras durante a avaliação.",
        required_present={"estereotipias motoras"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="routines-negated",
        text="A família relata que ele não fica irritado quando muda a rotina.",
        required_present=set(),
        optional_present=set(),
        required_negated={"insistência nas mesmas rotinas"},
    ),
    GoldenScenario(
        name="hyperfocus-negated",
        text="Nega interesses restritos e não tem interesses hiperfocados no momento.",
        required_present=set(),
        optional_present=set(),
        required_negated={"interesses hiperfocados"},
    ),
    GoldenScenario(
        name="agitation-negated",
        text="Nega agitação motora e não é muito agitado.",
        required_present=set(),
        optional_present=set(),
        required_negated={"agitação motora"},
    ),
    GoldenScenario(
        name="mixed-negation-and-positive-impulsivity",
        text="Nega impulsividade. Porém hoje está impulsivo e interrompe os outros.",
        required_present={"impulsividade"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="negative-control-no-target-symptoms",
        text=(
            "Boa alimentação, sono adequado e desempenho escolar dentro do esperado. "
            "Sem queixas atuais."
        ),
        required_present=set(),
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="attention-perde-foco-nao-mantem-atencao",
        text=(
            "A professora relata que ele perde o foco rapidamente em tarefas longas e "
            "não mantém a atenção quando precisa copiar do quadro."
        ),
        required_present={"dificuldade de foco"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="hyperactivity-inquieto-hiperatividade",
        text=(
            "Em sala, fica inquieto e não consegue ficar sentado. "
            "A família descreve hiperatividade e que ele é muito agitado em casa."
        ),
        required_present={"agitação motora"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="contrastive-mas-should-not-negate",
        text="Ele não é muito agitado, mas está inquieto.",
        required_present={"agitação motora"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="routines-resists-changes",
        text=(
            "Resiste a mudanças e não tolera mudança de rotina; fica irritado quando muda a rotina."
        ),
        required_present={"insistência nas mesmas rotinas"},
        optional_present=set(),
        required_negated=set(),
    ),
    GoldenScenario(
        name="sensory-ruidos",
        text=(
            "Muito sensível a ruídos e barulhos; "
            "incomoda com sons em locais cheios e tampa os ouvidos."
        ),
        required_present={"sensibilidade sensorial"},
        optional_present=set(),
        required_negated=set(),
    ),
]
