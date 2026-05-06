import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("Gemini api key: " + GEMINI_API_KEY)

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in .env")
if not QDRANT_URL:
    raise RuntimeError("Missing QDRANT_URL in .env")
if not QDRANT_API_KEY:
    raise RuntimeError("Missing QDRANT_API_KEY in .env")

try:
    import google.generativeai as genai
except ImportError as exc:
    raise ImportError(
        "google.generativeai is required. Install it with `pip install google-generativeai`."
    ) from exc

# Setup Keys
genai.configure(api_key=GEMINI_API_KEY)
client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
)

collection_name = "ambedkar_speeches"

# 1. Reset Database
print("Checking database...")
if client.collection_exists(collection_name):
    client.delete_collection(collection_name)

client.create_collection(
    collection_name=collection_name,
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)
print("Database reset. Starting Super Safe Upload (This will take ~45 mins)...")

# 2. Load Data
with open("prepared_chunks.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)

# 3. Upload Loop
vectors = []
batch_size = 50


def embed_text(text: str):
    max_attempts = 6
    for attempt in range(1, max_attempts + 1):
        try:
            emb = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document",
            )
            return emb["embedding"]
        except Exception as exc:
            wait_seconds = min(10 * attempt, 180)
            print(f"\n⚠️ Embed request failed on attempt {attempt}: {exc}")
            if attempt == max_attempts:
                raise
            print(f"   Waiting {wait_seconds} seconds before retrying...")
            time.sleep(wait_seconds)

for i, chunk in enumerate(chunks):
    text = chunk.get("text", "")
    if not text:
        continue

    embedding = embed_text(text)
    vectors.append(embedding)
    print(f"Processed {i+1}/{len(chunks)}")
    time.sleep(3)

    if len(vectors) >= batch_size:
        try:
            client.upload_collection(
                collection_name=collection_name,
                vectors=vectors,
                payload=chunks[i - (batch_size - 1): i + 1],
            )
            vectors = []
            print("--> Uploaded batch to Cloud")
        except Exception as exc:
            print(f"Upload failed: {exc}")
            raise

# Upload remaining
if vectors:
    client.upload_collection(
        collection_name=collection_name,
        vectors=vectors,
        payload=chunks[-len(vectors):],
    )

print("\n✅ Success! All data uploaded to Qdrant Cloud.")