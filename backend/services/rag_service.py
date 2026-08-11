import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from config import get_config

# Load config
config = get_config()

if config.GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = config.GOOGLE_API_KEY
if config.GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = config.GROQ_API_KEY

import chromadb
from chromadb.config import Settings

def get_embeddings():
    return GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

def get_vectorstore():
    embeddings = get_embeddings()
    
    if not config.CHROMA_API_KEY:
        # Fallback to local if no API key is provided
        return Chroma(persist_directory="chroma_db", embedding_function=embeddings)
    
    # Chroma Cloud connection
    client = chromadb.HttpClient(
        tenant=config.CHROMA_TENANT,
        database=config.CHROMA_DATABASE,
        settings=Settings(
            chroma_client_auth_provider="chromadb.auth.token_auth.TokenAuthClientProvider",
            chroma_client_auth_credentials=config.CHROMA_API_KEY
        )
    )
    
    return Chroma(client=client, collection_name="medical_reports", embedding_function=embeddings)

def upsert_report_to_chroma(report_id: str, text: str):
    """
    Chunks the extracted text of a medical report and upserts it to Chroma.
    """
    if not text or not text.strip():
        raise ValueError("Cannot upsert empty text.")

    # 1. Split Text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100
    )
    chunks = text_splitter.split_text(text)
    
    # 2. Add metadata
    metadatas = [{"report_id": report_id} for _ in chunks]
    
    # 3. Upsert to Chroma
    vectorstore = get_vectorstore()
    vectorstore.add_texts(texts=chunks, metadatas=metadatas)

def generate_diagnosis(report_id: str, question: str) -> str:
    """
    Retrieves context from Chroma based on the report_id and question,
    then generates an answer using Groq.
    """
    vectorstore = get_vectorstore()
    
    # 1. Retrieve relevant chunks using similarity search with filter
    docs = vectorstore.similarity_search(
        question, 
        k=4, 
        filter={"report_id": report_id}
    )
    
    context = "\n\n".join([doc.page_content for doc in docs])
    
    # 2. Setup Prompt
    prompt_template = """
    You are an expert AI medical assistant named MediAI Assistant. 
    You have been provided with the following extracted text from a patient's medical report:
    
    --- REPORT CONTEXT ---
    {context}
    ----------------------
    
    The patient asks: "{question}"
    
    Using ONLY the information provided in the report context, answer the patient's question clearly and professionally.
    If the context does not contain the answer, politely state that the provided report does not contain information to answer the question.
    Format your response nicely using Markdown (e.g., bullet points, bold text).
    Always end your response with a warning like: "⚠️ *This AI diagnosis is for informational purposes only and should not replace professional medical advice.*"
    """
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question"]
    )
    
    # 3. Generate response using Groq
    llm = ChatGroq(model_name="llama3-8b-8192", temperature=0.2)
    chain = prompt | llm
    
    response = chain.invoke({"context": context, "question": question})
    
    return response.content
