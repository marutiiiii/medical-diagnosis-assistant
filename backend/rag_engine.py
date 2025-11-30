# backend/rag_engine.py

import os
from typing import List
from dotenv import load_dotenv

import google.generativeai as genai
import pinecone

# Load .env from project root
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

GENAI_API_KEY = os.getenv("GENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "medical-reports")

if not GENAI_API_KEY:
    raise ValueError("GENAI_API_KEY is not set in .env")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY is not set in .env")

# --- Google Generative AI setup ---
genai.configure(api_key=GENAI_API_KEY)

# --- Pinecone setup ---
pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)


def embed_text(text: str) -> List[float]:
    """
    Convert text to embedding vector using Google 'text-embedding-004'.
    NOTE: embeddings API needs 'models/' prefix.
    """
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text
    )
    return result["embedding"]


def store_document_embeddings(document_id: str, chunks: list[str], username: str):
    """
    For each text chunk:
    - Create embedding
    - Upsert into Pinecone with metadata
    """
    vectors = []
    for i, chunk in enumerate(chunks):
        emb = embed_text(chunk)
        vectors.append(
            (
                f"{document_id}-{i}",  # unique id
                emb,
                {
                    "document_id": document_id,
                    "username": username,
                    "chunk_index": i,
                    "text": chunk,
                },
            )
        )

    index.upsert(vectors=vectors)


def retrieve_relevant_chunks(question: str, document_id: str, top_k: int = 5) -> list[str]:
    """
    Embed the question and query Pinecone for the most similar chunks.
    Filtered by the same document_id.
    """
    q_emb = embed_text(question)
    result = index.query(
        vector=q_emb,
        top_k=top_k,
        include_metadata=True,
        filter={"document_id": {"$eq": document_id}},
    )

    chunks = [m["metadata"]["text"] for m in result["matches"]]
    return chunks


def generate_answer(question: str, context_chunks: list[str]) -> str:
    """
    Build a prompt from context + question and call Gemini.
    NOTE: for generate_content we use plain model name 'gemini-1.5-flash'
    (no 'models/' prefix).
    """
    context = "\n\n".join(context_chunks)

    prompt = (
        "You are an AI assistant that explains medical reports for learning purposes only. "
        "Use ONLY the information in the context. "
        "If something is not in the context, say you are not sure.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Answer clearly and simply:"
    )

    # 👉 IMPORTANT: plain name, not 'models/gemini-1.5-flash'
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text
