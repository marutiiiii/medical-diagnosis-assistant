from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load .env from root folder
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not found")

client = MongoClient(MONGO_URI)

db = client["medical_diagnosis"]

users_collection = db["users"]
diagnosis_collection = db["diagnosis"]
