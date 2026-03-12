import os
import json
import re
import ollama

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


EVIDENCE_DIR = "evidence"
DB_DIR = "db"


def get_embeddings():
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


def get_vectordb(case_id: str):
    case_db_dir = os.path.join(DB_DIR, case_id)
    if not os.path.exists(case_db_dir):
        return None
    return Chroma(persist_directory=case_db_dir, embedding_function=get_embeddings())


def analyze_case_quality(case_data: dict, case_id: str) -> dict:
    """
    Analyzes quality of a case given its node/edge graph data and case_id for RAG context.
    Returns a quality score and detailed breakdown.
    """
    nodes = case_data.get("nodes", [])
    edges = case_data.get("edges", [])
    title = case_data.get("title", "Unknown Case")

    node_count = len(nodes)
    edge_count = len(edges)

    if node_count == 0:
        return {
            "overallScore": 0,
            "grade": "F",
            "breakdown": {
                "dataDensity": 0,
                "connectivity": 0,
                "entityDiversity": 0,
                "evidenceCoverage": 0,
            },
            "summary": "No investigation data found. Start by adding entities and evidence to the canvas.",
            "looseEnds": [],
            "pointsOfInterest": [],
        }

    # --- Data Density Score (0-100) ---
    data_density = min(100, int((node_count / 30) * 100))

    # --- Connectivity Score (0-100) ---
    ideal_edges = max(node_count - 1, 1)
    connectivity = min(100, int((edge_count / (ideal_edges * 2)) * 100))

    # --- Entity Diversity Score (0-100) ---
    node_types = set()
    for n in nodes:
        node_type = n.get("data", {}).get("type", "unknown")
        node_types.add(node_type)
    diversity = min(100, int((len(node_types) / 5) * 100))

    # --- Evidence Coverage (0-100) ---
    evidence_nodes = [n for n in nodes if n.get("type") in ["evidence", "hypothesis"]]
    evidence_coverage = min(100, int((len(evidence_nodes) / max(node_count * 0.3, 1)) * 100))

    overall = int((data_density * 0.25 + connectivity * 0.35 + diversity * 0.2 + evidence_coverage * 0.2))

    if overall >= 85: grade = "A"
    elif overall >= 70: grade = "B"
    elif overall >= 55: grade = "C"
    elif overall >= 40: grade = "D"
    else: grade = "F"

    # --- Build entity list for AI context ---
    entity_names = [n.get("data", {}).get("name", n.get("data", {}).get("label", "Unknown")) for n in nodes[:15]]
    edge_relations = [
        {
            "source": e.get("source", ""),
            "target": e.get("target", ""),
            "label": e.get("label", "related_to"),
        }
        for e in edges[:15]
    ]

    entity_str = ", ".join(entity_names) if entity_names else "No entities yet"
    edge_str = "; ".join([f"{r['source']} → {r['label']} → {r['target']}" for r in edge_relations[:8]]) or "No connections yet"

    # --- Retrieve relevant context from Case RAG ---
    try:
        vectordb = get_vectordb(case_id)
        if vectordb:
            retriever = vectordb.as_retriever(search_kwargs={"k": 4})
            relevant_docs = retriever.invoke(f"investigation loose ends missing evidence for {title}")
            rag_context = "\n".join([d.page_content[:600] for d in relevant_docs])
        else:
            rag_context = "No case-specific evidence vault found. Please upload documents in the Evidence Library."
    except Exception as e:
        print(f"RAG retrieval warning for {case_id}: {e}")
        rag_context = "Evidence retrieval interrupted."

    # --- LLM Analysis prompt ---
    prompt = f"""You are a senior intelligence analyst reviewing the case: "{title}" (ID: {case_id}).

CASE GRAPH SUMMARY:
- Total Entities/Nodes: {node_count}
- Total Connections: {edge_count}
- Entity names: {entity_str}
- Key relationships: {edge_str}

BACKGROUND INTELLIGENCE (FROM CASE EVIDENCE):
{rag_context}

Your task: Provide a concise, sharp intelligence analysis. Think like a detective focusing on this specific case.

Return ONLY valid JSON (no markdown, no explanation):
{{
  "summary": "2-sentence expert assessment of the investigation quality and state",
  "looseEnds": [
    {{"title": "short title", "description": "what's missing or unexplored", "severity": "high|medium|low"}},
    {{"title": "short title", "description": "gap in the evidence chain", "severity": "high|medium|low"}},
    {{"title": "short title", "description": "unanswered question", "severity": "medium|low"}}
  ],
  "pointsOfInterest": [
    {{"title": "short title", "description": "specific lead or anomaly worth investigating", "type": "connection|entity|financial|behavioral"}},
    {{"title": "short title", "description": "pattern or contradiction found", "type": "connection|entity|financial|behavioral"}},
    {{"title": "short title", "description": "recommended next investigative step", "type": "connection|entity|financial|behavioral"}}
  ]
}}"""

    try:
        response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.3}
        )
        content = response["message"]["content"]

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            ai_result = json.loads(json_match.group())
        else:
            raise ValueError("No JSON in LLM response")

    except Exception as e:
        print(f"LLM analysis error for {case_id}: {e}")
        ai_result = {
            "summary": f"Analysis of '{title}': Baseline graph analysis completed. Evidence library suggests deeper exploration of entity clusters.",
            "looseEnds": [],
            "pointsOfInterest": []
        }

    return {
        "overallScore": overall,
        "grade": grade,
        "breakdown": {
            "dataDensity": data_density,
            "connectivity": connectivity,
            "entityDiversity": diversity,
            "evidenceCoverage": evidence_coverage,
        },
        "summary": ai_result.get("summary", ""),
        "looseEnds": ai_result.get("looseEnds", [])[:5],
        "pointsOfInterest": ai_result.get("pointsOfInterest", [])[:5],
    }
