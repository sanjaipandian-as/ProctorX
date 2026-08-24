from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import uuid
from app.services.pdf_parser import extract_text_from_pdf, chunk_text
from app.services.nvidia_client import nvidia_client
from app.services.qdrant_client import qdrant_service
from app.services import document_registry

router = APIRouter(prefix="/api/ai/documents", tags=["documents"])

@router.post("")
async def upload_document(file: UploadFile = File(...), teacherId: str = Form(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if not teacherId.strip():
        raise HTTPException(status_code=400, detail="teacherId is required for data isolation.")
        
    try:
        content = await file.read()
        pages = extract_text_from_pdf(content)
        if not pages:
            raise HTTPException(status_code=400, detail="No text could be extracted from this PDF.")
        
        chunks = chunk_text(pages)
        if not chunks:
            raise HTTPException(status_code=400, detail="Document text is too short to chunk.")
            
        chunk_texts = [c["text"] for c in chunks]
        embeddings = await nvidia_client.get_embeddings(chunk_texts)
        
        if not embeddings:
            raise HTTPException(status_code=500, detail="Failed to generate embeddings for document chunks.")
            
        document_id = str(uuid.uuid4())
        qdrant_service.upsert_chunks(
            document_id=document_id,
            chunks=chunks,
            embeddings=embeddings,
            teacher_id=teacherId,
            filename=file.filename
        )

        # Register document metadata for teacher listing
        document_registry.register(
            teacher_id=teacherId,
            document_id=document_id,
            filename=file.filename,
            chunks_count=len(chunks)
        )

        return {
            "documentId": document_id,
            "filename": file.filename,
            "chunksCount": len(chunks)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
