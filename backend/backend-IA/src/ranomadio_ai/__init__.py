"""Service IA de RanoMadio Map.

Packages:
    api: routes FastAPI et dependances.
    core: configuration, logging, erreurs metier.
    domain: enums, entites et regles de negocio.
    ai: pipelines IA (embeddings, classification, dedup, matching).
    schemas: contrats Pydantic exposes par l'API.
    services: orchestration entre API et couches IA.
    infra: clients externes (Supabase, PostgreSQL, cache).
    utils: helpers purs (geo, texte, temps).
"""

__version__ = "0.1.0"