import traceback
from rag_engine import ingest_documents

try:
    ingest_documents("3348dab0-31d0-470e-b0e3-1804afd25f69")
    print("Ingestion success!")
except Exception as e:
    print("Ingestion failed:")
    traceback.print_exc()
