import os
import ollama
import base64
import fitz # PyMuPDF
import pandas as pd
import re
import io
from PIL import Image
from langchain_core.documents import Document as LCDocument

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

EVIDENCE_DIR = "evidence"
DB_DIR = "db"
VISION_MODEL = "moondream"

def describe_image(image_path: str):
    """Uses a vision model to describe an image for investigative intelligence."""
    try:
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        # Call vision model
        response = ollama.generate(
            model=VISION_MODEL,
            prompt="Analyze this investigative evidence image. Extract all readable text (OCR), identify people, objects, locations, and any suspicious activities. Be extremely detailed as this will be used for criminal analysis.",
            images=[image_data]
        )
        description = response.get('response', '')
        return f"--- [IMAGE ANALYSIS: {os.path.basename(image_path)}] ---\n{description}"
    except Exception as e:
        print(f"Vision error for {image_path}: {e}")
        return ""


def ingest_documents(case_id: str):
    """Indices documents for a specific case into a dedicated vector store."""
    documents = []
    case_evidence_dir = os.path.join(EVIDENCE_DIR, case_id)
    
    if not os.path.exists(case_evidence_dir):
        print(f"No evidence directory for case {case_id}")
        return

    for file in os.listdir(case_evidence_dir):
        file_lower = file.lower()
        file_path = os.path.join(case_evidence_dir, file)
        
        # 1. TEXT / MARKDOWN
        if file_lower.endswith((".txt", ".md")):
            try:
                loader = TextLoader(file_path)
                docs = loader.load()
                for d in docs:
                    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', d.page_content)
                    meta = {"case_id": case_id, "source": file}
                    if urls:
                        meta["urls"] = ", ".join(urls) # Store as comma-separated string for Chroma compatibility
                    d.metadata.update(meta)
                documents.extend(docs)
            except Exception as e:
                print(f"Error loading {file}: {e}")

        # 2. PDF (Text + Embedded Images)
        elif file_lower.endswith(".pdf"):
            try:
                print(f"Deep-analyzing PDF: {file}")
                pdf_doc = fitz.open(file_path)
                pdf_text = ""
                
                for page_index in range(len(pdf_doc)):
                    page = pdf_doc[page_index]
                    pdf_text += page.get_text()
                    
                    # Extract images from PDF page
                    image_list = page.get_images(full=True)
                    for img_index, img in enumerate(image_list):
                        try:
                            # Skip deep image analysis if moondream isn't ready
                            pass
                        except: pass
                
                urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', pdf_text)
                meta = {"case_id": case_id, "source": file}
                if urls:
                    meta["urls"] = ", ".join(urls)
                documents.append(LCDocument(
                    page_content=pdf_text,
                    metadata=meta
                ))
            except Exception as e:
                print(f"PDF Error {file}: {e}")

        # 3. EXCEL
        elif file_lower.endswith((".xlsx", ".xls")):
            try:
                print(f"Parsing structured data: {file}")
                excel_data = pd.read_excel(file_path, sheet_name=None)
                for sheet_name, df in excel_data.items():
                    sheet_text = f"SHEET: {sheet_name}\n" + df.to_string()
                    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', sheet_text)
                    meta = {"case_id": case_id, "source": f"{file}/{sheet_name}"}
                    if urls:
                        meta["urls"] = ", ".join(urls)
                    documents.append(LCDocument(
                        page_content=sheet_text,
                        metadata=meta
                    ))
            except Exception as e:
                print(f"Excel Error {file}: {e}")
        
        # 4. STANDALONE IMAGES
        elif file_lower.endswith((".png", ".jpg", ".jpeg", ".webp")):
            try:
                print(f"Processing visual evidence: {file}")
                description = describe_image(file_path)
                if description:
                    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', description)
                    meta = {"case_id": case_id, "source": file, "type": "image_analysis"}
                    if urls:
                        meta["urls"] = ", ".join(urls)
                    doc = LCDocument(
                        page_content=description,
                        metadata=meta
                    )
                    documents.append(doc)
            except Exception as e:
                print(f"Error analyzing image {file}: {e}")

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

    # Build a safe case slug for node IDs to avoid cross-case collisions
    import hashlib
    case_slug = hashlib.md5(case_id.encode()).hexdigest()[:8]

    user_prompt = f"""[STRICT DATA EXTRACTION TASK]
You are a precision data extractor for an investigative platform. Analyze the text for Case ID: {case_id}.
Return ONLY a valid JSON object. No words outside of the JSON.

TEXT TO ANALYZE:
{full_text}

JSON SCHEMA:
{{
  "nodes": [
    {{
      "id": "string (MUST use format: {case_slug}-n1, {case_slug}-n2, etc. - always prefix with '{case_slug}-')",
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
      "source": "id of source node (must match a node id above)",
      "target": "id of target node (must match a node id above)",
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
5. Node IDs MUST start with '{case_slug}-' (e.g., {case_slug}-n1, {case_slug}-n2).

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
def reconstruct_timeline(case_id: str):
    """
    Extracts chronological events from case evidence using the RAG engine.
    """
    import json
    import re
    import os
    
    # Check if DB exists for this case
    case_db_dir = os.path.join(DB_DIR, case_id)
    if not os.path.exists(case_db_dir):
        return {"events": [], "status": "no_database"}

    # Use RAG to fetch the most event-rich chunks across ALL evidence (text & images)
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectordb = Chroma(persist_directory=case_db_dir, embedding_function=embeddings)
    
    # Query specifically for temporal data to get high-density context
    retriever = vectordb.as_retriever(search_kwargs={"k": 10})
    docs = retriever.invoke("What are all the dates, specific events, travel activities, financial transfers, and meetings mentioned in the reports and image analysis?")
    
    full_text = "\n\n".join([f"FROM {d.metadata.get('source', 'Unknown')}:\n{d.page_content}" for d in docs])

    user_prompt = f"""[TIMELINE RECONSTRUCTION TASK]
Extract a chronological sequence of events from the evidence for Case ID: {case_id}.
Focus on specific dates, travel, meetings, transfers, and critical findings mentioned in the text and visual evidence analysis.

TEXT TO ANALYZE:
{full_text}

JSON SCHEMA:
{{
  "events": [
    {{
      "date": "YYYY-MM-DD",
      "title": "Short event title",
      "description": "Short 1-sentence detail",
      "type": "Travel|Financial|Comm|Intel|Action",
      "category": "Location|Bank|Network|Direct",
      "confidence": 0-100
    }}
  ]
}}

STRICT RULES:
1. Respond with ONLY valid JSON.
2. Sort events by date (ascending).
3. If a specific day is missing, use "YYYY-MM-01" or similar approximation based on context.
4. DO NOT invent events.

JSON:"""

    try:
        response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": user_prompt}],
            options={"temperature": 0.1}
        )
        raw = response["message"]["content"].strip()

        brace_match = re.search(r'\{[\s\S]*\}', raw)
        if brace_match:
            try:
                result = json.loads(brace_match.group(0))
                if "events" in result:
                    # Final sort just in case
                    result["events"].sort(key=lambda x: x.get("date", ""))
                    return result
            except: pass

    except Exception as e:
        print(f"[reconstruct_timeline] Error: {e}")

    return {"events": [], "error": "Failed to reconstruct timeline"}
