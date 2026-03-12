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
    Returns a JSON-formatted string containing nodes and edges.
    """
    documents = []
    if not os.path.exists(EVIDENCE_DIR):
        return {"nodes": [], "edges": []}

    for file in os.listdir(EVIDENCE_DIR):
        if file.endswith(".txt"):
            loader = TextLoader(os.path.join(EVIDENCE_DIR, file))
            documents.extend(loader.load())

    if not documents:
        return {"nodes": [], "edges": []}

    # Combine all documents into a single context for analysis
    # For a large number of documents, this should be chunked/summarized, 
    # but for this investigation, we'll process the combined text.
    full_text = "\n\n".join([d.page_content for d in documents[:10]]) # Limit to first 10 docs for safety

    prompt = f"""
You are a Lead Intelligence Analyst. Analyze the following evidence and extract a network of entities and their relationships.

Evidence:
{full_text}

Output ONLY a valid JSON object with the following structure:
{{
  "nodes": [
    {{
      "id": "unique_lowercase_id",
      "name": "Full Name",
      "type": "person|company|bank|location|offshore",
      "role": "Their job or function",
      "status": "Active|Abnormal|Flagged|Inactive",
      "credibilityScore": 0-100,
      "riskScore": 0-100
    }}
  ],
  "edges": [
    {{
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "Relationship description (e.g. 'Money Flow: $10M' or 'Owner')",
      "credibilityScore": 0-100
    }}
  ]
}}

Guidelines:
- credibilityScore: 0-100 based on how well-documented or verified the entity is in the evidence.
- riskScore: 0-100 based on suspicious activity, criminal ties, or illicit patterns revealed in the text.
- Ensure all IDs mentioned in 'edges' exist in 'nodes'.
"""

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    try:
        # Extract JSON from potential markdown code blocks
        content = response["message"]["content"]
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        import json
        return json.loads(content)
    except Exception as e:
        print(f"Failed to parse AI graph response: {e}")
        return {"nodes": [], "edges": [], "error": str(e)}