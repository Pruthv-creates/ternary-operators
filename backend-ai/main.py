import os
import shutil

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_engine import ingest_documents, query_rag

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder where uploaded evidence is stored
EVIDENCE_DIR = "evidence"
os.makedirs(EVIDENCE_DIR, exist_ok=True)


class Question(BaseModel):
    question: str


@app.get("/")
def home():
    return {"status": "AI backend running"}


@app.post("/upload")
async def upload_evidence(file: UploadFile = File(...)):

    file_path = f"{EVIDENCE_DIR}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Re-index documents after upload
    ingest_documents()

    return {"message": "Evidence uploaded and indexed"}


@app.post("/query")
async def query(data: Question):

    question = data.question

    answer, sources = query_rag(question)

    return {
        "answer": answer,
        "sources": sources
    }


# Alias endpoint so frontend can also call /ask
@app.post("/ask")
async def ask(data: Question):

    question = data.question

    answer, sources = query_rag(question)

    return {
        "answer": answer,
        "sources": sources
    }