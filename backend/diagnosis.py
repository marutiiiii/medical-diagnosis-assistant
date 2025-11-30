# backend/diagnosis.py

from datetime import datetime

from fastapi import APIRouter, HTTPException

from models import AskDiagnosis, PatientSearch
from rag_engine import retrieve_relevant_chunks, generate_answer
from database import diagnosis_collection

router = APIRouter(prefix="/diagnosis", tags=["diagnosis"])


@router.post("/from_report")
async def diagnosis_from_report(data: AskDiagnosis):
    """
    Use document_id + question + username to:
    - fetch relevant chunks from Pinecone
    - generate an answer using Gemini
    - store Q/A in MongoDB
    """
    chunks = retrieve_relevant_chunks(data.question, data.document_id)

    if not chunks:
        raise HTTPException(status_code=404, detail="No chunks found for this document_id")

    # 2) Generate answer with LLM
    answer = generate_answer(data.question, chunks)

    # Use username from the request (logged-in user)
    username = data.username

    record = {
        "username": username,
        "question": data.question,
        "answer": answer,
        "document_id": data.document_id,
        "created_at": datetime.utcnow().isoformat(),
    }

    # Don't crash if Mongo has a temporary issue
    try:
        diagnosis_collection.insert_one(record)
    except Exception as e:
        print("Mongo insert error:", e)

    record["_id"] = None
    return record



@router.post("/by_patient_name")
async def get_by_patient_name(data: PatientSearch):
    """
    Fetch all diagnosis records for a given patient_username.
    For now no auth; later doctors will use this.
    """
    cursor = diagnosis_collection.find(
        {"username": data.patient_username},
        {"_id": 0}
    ).sort("created_at", -1)

    records = list(cursor)
    return {"records": records}
