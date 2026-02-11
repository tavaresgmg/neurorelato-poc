from app.nlp.ontology import DEFAULT_ONTOLOGY_VERSION, get_ontology


def test_get_ontology_default_version() -> None:
    version, ontology = get_ontology()
    assert version == DEFAULT_ONTOLOGY_VERSION
    assert "dominios_clinicos" in ontology


def test_get_ontology_unknown_version_falls_back_to_default() -> None:
    version, ontology = get_ontology("unknown-version")
    assert version == DEFAULT_ONTOLOGY_VERSION
    assert "dominios_clinicos" in ontology
