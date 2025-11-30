from pydantic import BaseModel


class UserSignup(BaseModel):
    username: str
    password: str
    role: str  # "patient" or "doctor"


class UserLogin(BaseModel):
    username: str
    password: str


class AskDiagnosis(BaseModel):
    document_id: str
    question: str
    username: str  # 👈 NEW – who is asking?


class PatientSearch(BaseModel):
    patient_username: str
