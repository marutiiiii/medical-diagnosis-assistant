# backend/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import users_collection
from models import UserSignup, UserLogin
from auth import hash_password, verify_password, create_access_token

import reports
import diagnosis

app = FastAPI(title="Medical Diagnosis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Backend running!"}


@app.post("/auth/signup")
def signup(data: UserSignup):
    if data.role not in ["patient", "doctor"]:
        raise HTTPException(status_code=400, detail="Role must be patient/doctor")

    if users_collection.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already exists")

    users_collection.insert_one(
        {
            "username": data.username,
            "password_hash": hash_password(data.password),
            "role": data.role,
        }
    )

    return {"message": "User created"}


@app.post("/auth/login")
def login(data: UserLogin):
    user = users_collection.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user["username"], "role": user["role"]})

    return {"token": token, "role": user["role"]}


# Routers
app.include_router(reports.router)
app.include_router(diagnosis.router)
