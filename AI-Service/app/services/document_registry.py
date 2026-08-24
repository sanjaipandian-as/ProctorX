"""
Document Registry — lightweight JSON-backed metadata store per teacher.

Stores document upload metadata (documentId, filename, chunksCount, uploadedAt)
in a persistent JSON file alongside Qdrant storage. This avoids adding a DB table
while still letting teachers list and delete their uploaded documents.
"""

import json
import os
from datetime import datetime, timezone
from threading import Lock

_REGISTRY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "qdrant_storage",
    "document_registry.json"
)

_lock = Lock()


def _load() -> dict:
    """Load registry from disk. Returns empty dict on first run."""
    if not os.path.exists(_REGISTRY_PATH):
        return {}
    try:
        with open(_REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save(data: dict) -> None:
    """Persist registry to disk atomically."""
    os.makedirs(os.path.dirname(_REGISTRY_PATH), exist_ok=True)
    tmp_path = _REGISTRY_PATH + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    os.replace(tmp_path, _REGISTRY_PATH)


def register(teacher_id: str, document_id: str, filename: str, chunks_count: int) -> dict:
    """Register a newly uploaded document for a teacher."""
    entry = {
        "documentId": document_id,
        "filename": filename,
        "chunksCount": chunks_count,
        "uploadedAt": datetime.now(timezone.utc).isoformat()
    }
    with _lock:
        data = _load()
        if teacher_id not in data:
            data[teacher_id] = []
        # Remove stale entry with same documentId (re-upload protection)
        data[teacher_id] = [d for d in data[teacher_id] if d["documentId"] != document_id]
        data[teacher_id].append(entry)
        _save(data)
    return entry


def list_documents(teacher_id: str) -> list:
    """Return all documents uploaded by a teacher, newest first."""
    with _lock:
        data = _load()
    docs = data.get(teacher_id, [])
    return sorted(docs, key=lambda d: d.get("uploadedAt", ""), reverse=True)


def delete_document(teacher_id: str, document_id: str) -> bool:
    """Remove a document entry from the registry. Returns True if found and deleted."""
    with _lock:
        data = _load()
        original_count = len(data.get(teacher_id, []))
        data[teacher_id] = [
            d for d in data.get(teacher_id, [])
            if d["documentId"] != document_id
        ]
        deleted = len(data.get(teacher_id, [])) < original_count
        if deleted:
            _save(data)
    return deleted


def get_document(teacher_id: str, document_id: str) -> dict | None:
    """Fetch a single document entry."""
    with _lock:
        data = _load()
    for doc in data.get(teacher_id, []):
        if doc["documentId"] == document_id:
            return doc
    return None
