import os
import shutil

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from rag_engine import ingest_documents, query_rag
from case_analyzer import analyze_case_quality

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


@app.post("/upload")
async def upload_evidence(case_id: str, file: UploadFile = File(...)):
    """Upload evidence for a specific case and re-index only that case."""
    case_evidence_dir = os.path.join(EVIDENCE_DIR, case_id)
    os.makedirs(case_evidence_dir, exist_ok=True)
    
    file_path = os.path.join(case_evidence_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Re-index documents for THIS CASE ONLY after upload
    from rag_engine import ingest_documents
    ingest_documents(case_id)

    return {"message": f"Evidence for case {case_id} uploaded and indexed"}


class Question(BaseModel):
    question: str
    case_id: str


class RelationRequest(BaseModel):
    entity1: str
    entity2: str
    context: str = ""
    case_id: str


@app.get("/")
def home():
    return {"status": "AI backend running"}


@app.post("/query")
async def query(data: Question):
    from rag_engine import query_rag
    answer, sources = query_rag(data.question, data.case_id)
    return {
        "answer": answer,
        "sources": sources
    }


@app.post("/analyze")
def analyze(case_id: str):
    from rag_engine import analyze_graph
    return analyze_graph(case_id)


# Alias endpoint so frontend can also call /ask
@app.post("/ask")
async def ask(data: Question):
    from rag_engine import query_rag
    answer, sources = query_rag(data.question, data.case_id)
    return {
        "answer": answer,
        "sources": sources
    }


@app.post("/generate-relation")
async def generate_relation(data: RelationRequest):
    """Generate a relationship type between two entities using LLM"""
    try:
        import json
        import re
        
        # Query the knowledge base for context about both entities
        entity1_info, _ = query_rag(f"Who or what is {data.entity1}? What are their activities and connections?", data.case_id)
        entity2_info, _ = query_rag(f"Who or what is {data.entity2}? What are their activities and connections?", data.case_id)
        
        # Also query for direct connections
        connection_query = f"What is the relationship between {data.entity1} and {data.entity2}? Are they connected? How?"
        connection_info, _ = query_rag(connection_query)
        
        # Build the prompt for LLM to determine relationship type
        prompt = f"""Based on the following information, determine the most likely relationship type between {data.entity1} and {data.entity2}.

Information about {data.entity1}:
{entity1_info[:500]}

Information about {data.entity2}:
{entity2_info[:500]}

Direct connection information:
{connection_info[:300]}

Additional context: {data.context}

Respond with ONLY a JSON object (no markdown, no extra text):
{{"relationship_type": "one of the types below", "confidence": 0-100, "reasoning": "1-2 sentences"}}

Valid relationship types: related_to, associates_with, controls, owns, employs, manages, reports_to, funds, benefits_from, competes_with, collaborates_with, transacts_with, communicates_with, located_near, supply_chain"""

        # Call LLM through the RAG engine
        response_text, _ = query_rag(prompt, data.case_id)
        
        # Try to parse the response
        try:
            # Find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                # Fallback if no JSON found
                result = {
                    "relationship_type": "related_to",
                    "confidence": 30,
                    "reasoning": response_text[:200]
                }
        except json.JSONDecodeError:
            result = {
                "relationship_type": "related_to",
                "confidence": 20,
                "reasoning": response_text[:200]
            }
        
        return result
        
    except Exception as e:
        print(f"Error generating relation: {e}")
        return {
            "relationship_type": "related_to",
            "confidence": 0,
            "reasoning": f"Error: {str(e)}"
        }


class CaseAnalysisRequest(BaseModel):
    case_id: str
    title: str
    nodes: list = []
    edges: list = []


@app.post("/analyze-case")
async def analyze_case(data: CaseAnalysisRequest):
    """
    Deep-analyzes a case's graph data using LLM + RAG focused on case_id context.
    """
    try:
        from case_analyzer import analyze_case_quality
        result = analyze_case_quality({
            "title": data.title,
            "nodes": data.nodes,
            "edges": data.edges,
        }, data.case_id)
        return result
    except Exception as e:
        print(f"Error analyzing case: {e}")
        return {
            "overallScore": 0,
            "grade": "N/A",
            "breakdown": {"dataDensity": 0, "connectivity": 0, "entityDiversity": 0, "evidenceCoverage": 0},
            "summary": f"Analysis failed: {str(e)}",
            "looseEnds": [],
            "pointsOfInterest": [],
        }