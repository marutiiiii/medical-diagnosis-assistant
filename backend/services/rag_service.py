import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from config import get_config

# Load config
config = get_config()

if config.GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = config.GOOGLE_API_KEY
if config.GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = config.GROQ_API_KEY
if config.PINECONE_API_KEY:
    os.environ["PINECONE_API_KEY"] = config.PINECONE_API_KEY

PINECONE_INDEX_NAME = config.PINECONE_INDEX_NAME or "medical-diagnosis-index"

def init_pinecone_index():
    """Initializes the pinecone index if it doesn't exist."""
    api_key = os.environ.get("PINECONE_API_KEY")
    if not api_key or api_key == "your_pinecone_api_key_here":
        return None # Do not fail immediately if keys aren't set yet during app startup
        
    pc = Pinecone(api_key=api_key)
    existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]
    if PINECONE_INDEX_NAME not in existing_indexes:
        # Assuming google embeddings (text-embedding-004) which is 768 dimensions
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
    return pc

def get_embeddings():
    return GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

def get_vectorstore():
    init_pinecone_index()
    embeddings = get_embeddings()
    return PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)

def upsert_report_to_pinecone(report_id: str, text: str):
    """
    Chunks the extracted text of a medical report and upserts it to Pinecone.
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
    
    # 3. Upsert to Pinecone
    vectorstore = get_vectorstore()
    vectorstore.add_texts(texts=chunks, metadatas=metadatas)

def generate_diagnosis(report_id: str, question: str) -> str:
    """
    Retrieves context from Pinecone based on the report_id and question,
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
