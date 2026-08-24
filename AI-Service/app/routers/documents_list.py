"""
Document list and delete endpoints.

GET  /api/ai/documents/list?teacherId=<id>  → list all uploaded documents
DELETE /api/ai/documents/<documentId>?teacherId=<id> → remove from registry + Qdrant
"""

from fastapi import APIRouter, HTTPException, Query
from app.services import document_registry
from app.services.qdrant_client import qdrant_service

router = APIRouter(prefix="/api/ai/documents", tags=["documents"])


@router.get("/list")
def list_documents(teacherId: str = Query(..., description="Teacher ID from JWT")):
    if not teacherId.strip():
        raise HTTPException(status_code=400, detail="teacherId is required")
    docs = document_registry.list_documents(teacherId)
    return {"documents": docs, "total": len(docs)}


@router.delete("/{document_id}")
def delete_document(document_id: str, teacherId: str = Query(...)):
    if not teacherId.strip():
        raise HTTPException(status_code=400, detail="teacherId is required")

    # Verify the document belongs to this teacher
    doc = document_registry.get_document(teacherId, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    # Remove from PGVector store
    try:
        qdrant_service.delete_document(document_id=document_id, teacher_id=teacherId)
    except Exception as e:
        print(f"[documents_list] PGVector deletion error (non-fatal): {e}")

    # Remove from registry
    deleted = document_registry.delete_document(teacherId, document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found in registry")

    return {"success": True, "documentId": document_id}
