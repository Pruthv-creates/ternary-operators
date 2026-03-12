import os
import ollama

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

EVIDENCE_DIR = "evidence"
DB_DIR = "db"


def ingest_documents(case_id: str):
    """Indices documents for a specific case into a dedicated vector store."""
    documents = []
    case_evidence_dir = os.path.join(EVIDENCE_DIR, case_id)
    
    if not os.path.exists(case_evidence_dir):
        print(f"No evidence directory for case {case_id}")
        return

    for file in os.listdir(case_evidence_dir):
        if file.endswith(".txt") or file.endswith(".pdf") or file.endswith(".md"):
            try:
                # Basic TextLoader for tx/md. For PDF you might need PyPDFLoader
                loader = TextLoader(os.path.join(case_evidence_dir, file))
                docs = loader.load()
                for d in docs:
                    d.metadata["case_id"] = case_id
                    d.metadata["source"] = file
                documents.extend(docs)
            except Exception as e:
                print(f"Error loading {file}: {e}")

    if not documents:
        return

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_documents(documents)
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    case_db_dir = os.path.join(DB_DIR, case_id)
    vectordb = Chroma.from_documents(
        chunks,
        embeddings,
        persist_directory=case_db_dir
    )
    vectordb.persist()


def query_rag(question: str, case_id: str):
    """Queries the vector store associated with a specific case."""
    case_db_dir = os.path.join(DB_DIR, case_id)
    if not os.path.exists(case_db_dir):
        return "No intelligence database found for this case. Please upload evidence first.", []

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectordb = Chroma(persist_directory=case_db_dir, embedding_function=embeddings)
    retriever = vectordb.as_retriever(search_kwargs={"k": 5})
    docs = retriever.invoke(question)

    context = "\n\n".join([d.page_content for d in docs])
    prompt = f"""
You are an investigative intelligence assistant. You are analyzing evidence for Case ID: {case_id}.

Use ONLY the evidence below to answer the question. If the information isn't in the evidence, state that you don't know based on current case files.

Evidence:
{context}

Question:
{question}
"""

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    answer = response["message"]["content"]
    sources = list(set([d.metadata.get("source", "unknown") for d in docs]))

    return answer, sources


def analyze_graph(case_id: str):
    """
    Analyzes case-specific documents to extract entities and relationships.
    """
    import json
    import re

    documents = []
    case_evidence_dir = os.path.join(EVIDENCE_DIR, case_id)
    
    if not os.path.exists(case_evidence_dir):
        return {"nodes": [], "edges": []}

    for file in sorted(os.listdir(case_evidence_dir)):
        if file.endswith(".txt") or file.endswith(".md"):
            try:
                loader = TextLoader(os.path.join(case_evidence_dir, file))
                documents.extend(loader.load())
            except Exception:
                pass

    if not documents:
        return {"nodes": [], "edges": []}

    # Take only the most relevant chunks to keep context short
    documents.sort(key=lambda x: str(x.metadata.get("source", "")), reverse=True)
    top_docs = documents[:3]
    full_text = "\n\n".join([d.page_content[:1500] for d in top_docs])

    user_prompt = f"""[STRICT DATA EXTRACTION TASK]
You are a precision data extractor for an investigative platform. Analyze the text for Case ID: {case_id}.
Return ONLY a valid JSON object. No words outside of the JSON.

TEXT TO ANALYZE:
{full_text}

JSON SCHEMA:
{{
  "nodes": [
    {{
      "id": "string (use n1, n2, etc)",
      "name": "Full Name or Company Name",
      "type": "person|company|bank|location|offshore",
      "role": "Specific role, e.g., CEO, Money Launderer, Hub",
      "status": "Active|Abnormal|Flagged|Inactive",
      "credibilityScore": 0-100,
      "riskScore": 0-100
    }}
  ],
  "edges": [
    {{
      "source": "id of source node",
      "target": "id of target node",
      "label": "relationship type (e.g., controls, owns, transacts_with)",
      "credibilityScore": 0-100
    }}
  ]
}}

STRICT RULES:
1. No Markdown formatting (no ```json).
2. ONLY one JSON object.
3. Every person or company must have exactly one node.
4. Extract only facts present in the text.

JSON:"""

    try:
        response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": user_prompt}],
            options={"temperature": 0.1, "num_predict": 1800}
        )
        raw = response["message"]["content"].strip()

        # Strategy 1: find JSON block
        brace_match = re.search(r'\{[\s\S]*\}', raw)
        if brace_match:
            try:
                result = json.loads(brace_match.group(0))
                if "nodes" in result:
                    return result
            except: pass

        # Strategy 2: code blocks
        match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
        if match:
            try:
                result = json.loads(match.group(1).strip())
                if "nodes" in result:
                    return result
            except: pass

    except Exception as e:
        print(f"[analyze_graph] Error for {case_id}: {e}")

    return {"nodes": [], "edges": [], "error": f"Failed to extract graph for case {case_id}"}