# LLM Ambedkar 🤖🕊️  
**Dr. B. R. Ambedkar RAG Backend + Voice API**

LLM Ambedkar is a Retrieval-Augmented Generation (RAG) based AI system that answers questions about Dr. B. R. Ambedkar and generates spoken responses in `.wav` format.  
It is designed to work with Unreal Engine, Three.js, or any web/frontend client for building an interactive AI avatar.

---

## 🚀 Features

- 📚 RAG Pipeline using Qdrant Vector Database  
- 🧠 Context-aware answers from Ambedkar documents  
- 🔊 Automatic `.wav` audio generation using Text-to-Speech  
- 🌐 REST API using FastAPI  
- 🎮 Ready to integrate with Unreal Engine & Web Frontends  

---

## 🏗️ Architecture

Frontend / Unreal Engine
↓
FastAPI (/ask)
↓
RAG
(Qdrant + Gemini)
↓
Answer Generation
↓
TTS (.wav audio)
↓
audio_url returned


---

## 📁 Project Structure

Dr.Ambedkar-Rag/
│
├── api.py # FastAPI server
├── rag.py # RAG logic
├── chunks.py # Text chunking
├── embed_and_index.py # Embedding + upload to Qdrant
├── create_qdrant_db.py # Create Qdrant collection
├── requirements.txt # Python dependencies
├── audio/ # Generated .wav files
├── data/ # Source documents
└── .env # API keys


---

## ⚙️ Installation

Create and activate a virtual environment:

```bash
python -m venv env
env\Scripts\activate
Install dependencies:

pip install -r requirements.txt


🧩 Prepare the Database (Run Once)
Run these commands in order to create database:

python create_qdrant_db.py
python chunks.py
python embed_and_index.py


🔑 Set API Keys
Create a .env file in the root directory:
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
QDRANT_API_KEY=YOUR_QDRANT_API_KEY
QDRANT_URL=http://localhost:6333



uvicorn api:app --reload
Backend will run at:



http://127.0.0.1:8000
You should see:

API loaded
RAG loaded
Uvicorn running on http://127.0.0.1:8000
🧪 API Testing (Thunder Client / Postman)
Endpoint
POST http://127.0.0.1:8000/ask
Headers
Content-Type: application/json
Body (JSON)
{
  "question": "Who was Dr. B. R. Ambedkar?"
}
Response Example
{
  "question": "Who was Dr. B. R. Ambedkar?",
  "answer": "Dr. B. R. Ambedkar was a social reformer...",
  "audio_url": "http://127.0.0.1:8000/audio/abcd1234.wav"
}
Open the audio_url in your browser → the .wav file will play.



🌐 API Documentation
Swagger UI:

http://127.0.0.1:8000/docs
✨ Final Pipeline
User Question
   ↓
FastAPI (/ask)
   ↓
RAG Answer
   ↓
.wav Voice Generation
   ↓
Frontend / Unreal Avatar speaks# ai_avatar
