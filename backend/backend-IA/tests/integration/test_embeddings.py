"""Test du modele d'embeddings (marquage `integration`, necessite un download)."""

import pytest

from ranomadio_ai.ai.embeddings import cosine_matrix, embed, similarity
from ranomadio_ai.ai.registry import ModelNotAvailableError, get_embedding_model

pytestmark = pytest.mark.integration


def test_model_loads_and_has_dimension() -> None:
    model = get_embedding_model()
    assert model.get_sentence_embedding_dimension() > 0


def test_similar_texts_score_higher_than_unrelated() -> None:
    close = similarity(
        "panne de pompe a eau, plus d'eau dans le quartier",
        "le puits est casse, les habitants n'ont plus d'eau",
    )
    far = similarity(
        "panne de pompe a eau, plus d'eau dans le quartier",
        "le club de football organise un tournoi samedi",
    )
    assert close > far


def test_cosine_matrix_returns_one_score_per_candidate() -> None:
    scores = cosine_matrix("besoin d'eau potable", ["bidons d'eau", "match de foot", "repas"])
    assert len(scores) == 3
    assert all(0.0 <= score <= 1.0 for score in scores)


def test_embed_returns_normalized_matrix() -> None:
    vectors = embed(["eau", "pneus"])
    assert vectors.shape[0] == 2
    assert abs(float((vectors[0] ** 2).sum()) - 1.0) < 1e-3


def test_empty_input_returns_empty_matrix() -> None:
    assert embed([]).shape[0] == 0


def test_model_error_is_typed() -> None:
    from ranomadio_ai.core.errors import AIError

    assert issubclass(ModelNotAvailableError, AIError)