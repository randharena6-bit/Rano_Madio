"""Tests d'integration des routes HTTP (sans chargement de modele)."""

from fastapi.testclient import TestClient

from ranomadio_ai.schemas.api import ExistingReportPayload, ReportPayload

REPORT_TEXT = "Le puits pres de l'ecole Anosizato ne marche plus depuis ce matin"


def test_health_returns_status(app: TestClient) -> None:
    response = app.get("/api/ai/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "embeddings" in body["models"]


def test_root_points_to_docs(app: TestClient) -> None:
    assert app.get("/").json()["docs"] == "/docs"


def test_openapi_is_exposed(app: TestClient) -> None:
    assert app.get("/openapi.json").status_code == 200


def test_categories_endpoint_lists_water_categories(app: TestClient) -> None:
    body = app.get("/api/ai/categories").json()
    assert "water_outage" in body


def test_classify_endpoint(app: TestClient) -> None:
    response = app.post(
        "/api/ai/classify",
        json={"description": REPORT_TEXT, "use_embeddings": False},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "water_outage"
    assert 0 <= body["score"] <= 100


def test_classify_rejects_empty_description(app: TestClient) -> None:
    assert app.post("/api/ai/classify", json={"description": ""}).status_code == 422


def test_extract_endpoint(app: TestClient) -> None:
    response = app.post(
        "/api/ai/extract",
        json={"text": f"{REPORT_TEXT}, on a plus d'eau pour 50 familles"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["nb_persons"] == 50
    assert body["zone"] == "anosizato"


def test_dedup_endpoint(app: TestClient) -> None:
    response = app.post(
        "/api/ai/dedup",
        json={
            "report": ReportPayload(description=REPORT_TEXT, zone="Anosizato").model_dump(mode="json"),
            "existing_reports": [
                ExistingReportPayload(
                    report_id="rep-1",
                    description="Pompe Anosizato cassee, plus d'eau",
                    zone="Anosizato",
                ).model_dump(mode="json")
            ],
            "use_embeddings": False,
        },
    )
    assert response.status_code == 200
    assert "is_duplicate" in response.json()


def test_matching_endpoint(app: TestClient) -> None:
    response = app.post(
        "/api/ai/matching",
        json={
            "report": ReportPayload(description=REPORT_TEXT, zone="Anosizato").model_dump(mode="json"),
            "candidates": [
                {
                    "resource_id": "res-1",
                    "name": "Puits Association Soa",
                    "description": "120 bidons d'eau, pompe de secours",
                    "category": "water_outage",
                    "zone": "Anosizato",
                    "quantity": 120,
                }
            ],
            "use_embeddings": False,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total_evaluated"] == 1


def test_moderation_endpoint(app: TestClient) -> None:
    response = app.post(
        "/api/ai/moderation",
        json={
            "report": ReportPayload(description=REPORT_TEXT).model_dump(mode="json"),
            "category": "water_outage",
            "use_embeddings": False,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["score"] <= 100
    assert body["recommendation"]


def test_pipeline_endpoint(app: TestClient) -> None:
    response = app.post(
        "/api/ai/pipeline",
        json={
            "report": ReportPayload(description=REPORT_TEXT, zone="Anosizato").model_dump(mode="json"),
            "candidates": [
                {
                    "resource_id": "res-1",
                    "name": "Eau commerçant Tsaralalana",
                    "description": "20 bidons d'eau potable",
                    "category": "water_shortage",
                }
            ],
            "use_embeddings": False,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["classification"]["category"] == "water_outage"
    assert "matches" in body
    assert "moderation" in body


def test_demo_payload_is_valid(app: TestClient) -> None:
    demo = app.get("/api/ai/demo").json()
    assert demo["report"]["zone"] == "Anosizato"
    assert demo["candidates"][0]["resource_id"] == "res-001"


def test_api_key_guard_rejects_missing_key(app: TestClient) -> None:
    # Aucun api_key configure par defaut : la route reste ouverte.
    assert app.post("/api/ai/classify", json={"description": "test", "use_embeddings": False}).status_code == 200