import os
import ollama

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

EVIDENCE_DIR = "evidence"
DB_DIR = "db"


def ingest_documents():

    documents = []

    for file in os.listdir(EVIDENCE_DIR):

        if file.endswith(".txt"):

            loader = TextLoader(os.path.join(EVIDENCE_DIR, file))
            docs = loader.load()

            for d in docs:
                d.metadata["source"] = file

            documents.extend(docs)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )

    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectordb = Chroma.from_documents(
        chunks,
        embeddings,
        persist_directory=DB_DIR
    )

    vectordb.persist()


def query_rag(question):

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectordb = Chroma(
        persist_directory=DB_DIR,
        embedding_function=embeddings
    )

    retriever = vectordb.as_retriever(search_kwargs={"k": 5})

    docs = retriever.invoke(question)

    context = "\n\n".join([d.page_content for d in docs])

    prompt = f"""
You are an investigative intelligence assistant.

Use ONLY the evidence below.

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

    sources = list(set([d.metadata["source"] for d in docs]))

    return answer, sources


def analyze_graph():
    """
    Analyzes all ingested documents to extract entities and relationships.
    Returns nodes and edges for the knowledge graph.
    """
    import json
    import re

    documents = []
    if not os.path.exists(EVIDENCE_DIR):
        return {"nodes": [], "edges": []}

    for file in sorted(os.listdir(EVIDENCE_DIR)):
        if file.endswith(".txt"):
            try:
                loader = TextLoader(os.path.join(EVIDENCE_DIR, file))
                documents.extend(loader.load())
            except Exception:
                pass

    if not documents:
        return {"nodes": [], "edges": []}

    # Take only the most relevant chunks to keep context short
    documents.sort(key=lambda x: str(x.metadata.get("source", "")), reverse=True)
    full_text = "\n\n".join([d.page_content[:1000] for d in documents[:4]])

    # Very explicit, compact prompt that works reliably with llama3
    user_prompt = f"""TASK: Extract named entities and their relationships from the text below.
Respond with ONLY a JSON object. No explanation, no markdown, no commentary.

TEXT:
{full_text}

OUTPUT FORMAT (fill in real values):
{{"nodes":[{{"id":"n1","name":"Full Name","type":"person","role":"Job Title","status":"Active","credibilityScore":80,"riskScore":40}},{{"id":"n2","name":"Company Name","type":"company","role":"Corporation","status":"Active","credibilityScore":70,"riskScore":60}}],"edges":[{{"source":"n1","target":"n2","label":"controls","credibilityScore":75}}]}}

Types allowed: person, company, bank, location, offshore
Status allowed: Active, Abnormal, Flagged, Inactive
Scores: integers 0-100

JSON:"""

    try:
        response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": user_prompt}],
            options={"temperature": 0.1, "num_predict": 1500}
        )
        raw = response["message"]["content"].strip()

        # --- Multi-strategy JSON extraction ---

        # Strategy 1: find the outermost { ... } block
        brace_match = re.search(r'\{[\s\S]*\}', raw)
        if brace_match:
            candidate = brace_match.group(0)
            try:
                result = json.loads(candidate)
                if "nodes" in result and isinstance(result["nodes"], list):
                    print(f"[analyze_graph] Parsed {len(result['nodes'])} nodes, {len(result.get('edges', []))} edges")
                    return result
            except json.JSONDecodeError:
                pass

        # Strategy 2: find JSON inside ```json ... ``` or ``` ... ```
        for pattern in [r'```json\s*([\s\S]*?)```', r'```\s*([\s\S]*?)```']:
            match = re.search(pattern, raw)
            if match:
                try:
                    result = json.loads(match.group(1).strip())
                    if "nodes" in result:
                        return result
                except json.JSONDecodeError:
                    pass

        # Strategy 3: Find arrays directly and reconstruct
        nodes_match = re.search(r'"nodes"\s*:\s*(\[[\s\S]*?\])', raw)
        edges_match = re.search(r'"edges"\s*:\s*(\[[\s\S]*?\])', raw)
        if nodes_match:
            try:
                nodes = json.loads(nodes_match.group(1))
                edges = json.loads(edges_match.group(1)) if edges_match else []
                print(f"[analyze_graph] Reconstructed {len(nodes)} nodes via strategy 3")
                return {"nodes": nodes, "edges": edges}
            except json.JSONDecodeError:
                pass

        # Strategy 4: Ask LLM to fix its own output
        print(f"[analyze_graph] All strategies failed, requesting JSON fix from LLM...")
        fix_prompt = f"""The following text should be a JSON object with 'nodes' and 'edges' arrays.
Extract and output ONLY the valid JSON, nothing else:

{raw[:2000]}

JSON:"""
        fix_response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": fix_prompt}],
            options={"temperature": 0.0, "num_predict": 800}
        )
        fix_raw = fix_response["message"]["content"].strip()
        fix_match = re.search(r'\{[\s\S]*\}', fix_raw)
        if fix_match:
            result = json.loads(fix_match.group(0))
            if "nodes" in result:
                return result

    except Exception as e:
        print(f"[analyze_graph] Error: {e}")

    return {"nodes": [], "edges": [], "error": "Could not extract graph data from documents."}