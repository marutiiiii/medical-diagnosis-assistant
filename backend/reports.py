# backend/reports.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4
import fitz  # PyMuPDF

from rag_engine import store_document_embeddings

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/upload")
async def upload_report(file: UploadFile = File(...)):
    """
    PUBLIC endpoint (no authentication):
    - Accept PDF / TXT
    - Extract text
    - Chunk and store embeddings in Pinecone
    - Return document_id
    """

    if file.content_type not in ["application/pdf", "text/plain"]:
        raise HTTPException(status_code=400, detail="Only PDF or TXT supported")

    raw = await file.read()

    # 1) Extract text
    if file.content_type == "application/pdf":
        temp_path = "temp.pdf"
        with open(temp_path, "wb") as f:
            f.write(raw)

        doc = fitz.open(temp_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
    else:
        text = raw.decode("utf-8", errors="ignore")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from file")

    # 2) Chunking
    chunk_size = 800
    chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

    # 3) Create document_id
    document_id = str(uuid4())

    # TEMP: fake username, because we have no auth now
    fake_username = "demo_patient"

    # 4) Store in Pinecone
    store_document_embeddings(document_id, chunks, fake_username)

    return {
        "status": "uploaded",
        "document_id": document_id,
        "chunks": len(chunks),
    }
