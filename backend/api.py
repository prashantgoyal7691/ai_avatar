from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from rag import answer_question
from gtts import gTTS
import os
import uuid
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

app = FastAPI()
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
#avatar123
# 🔗 MongoDB Connection
client = MongoClient(
        MONGO_URI,
    tlsCAFile=certifi.where()
)
db = client["ai_avatar"]
users_collection = db["users"]

# 🌐 Enable CORS
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["https://ai-avatar-dba.netlify.app","http://localhost:5173"],
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🎧 Audio setup
os.makedirs("audio", exist_ok=True)
app.mount("/audio", StaticFiles(directory="audio"), name="audio")


# 🏠 Home route
@app.get("/")
def home():
    return {"status": "Dr. Ambedkar API is Live"}


# 🤖 Ask AI + Save Chat
@app.post("/ask")
async def ask_endpoint(request: Request):
    data = await request.json()

    question = data.get("question")
    userId = data.get("userId")
    email = data.get("email") 
    chatId = data.get("chatId")

   

    print(f"User: {userId} | Chat: {chatId}")
    print(f"Question: {question}")



    # 🔹 Ensure user exists

    if not userId:
        return {
            "answer": text_response,
            "audio_url": f"/audio/{filename}"
        }
    
    user = users_collection.find_one({"userId": userId})

    if not user:
        users_collection.insert_one({
            "userId": userId,
            "email": email,
            "chats": []
        })
    
    # 🔥 ensure email stays updated
    if user and email and not user.get("email"):
        users_collection.update_one(
            {"userId": userId},
            {"$set": {"email": email}}
        )

    # 🔹 Get AI response (RAG)
    text_response = answer_question(question)

    # 🔹 Generate audio
    filename = f"{uuid.uuid4()}.mp3"
    filepath = f"audio/{filename}"
    tts = gTTS(text=text_response, lang="en")
    tts.save(filepath)

    if not userId:
        return {
            "answer": text_response,
            "audio_url": f"/audio/{filename}"
        }

    # 🔹 Check if chat exists
    chat_exists = users_collection.find_one({
        "userId": userId,
        "chats.chatId": chatId
    })

    if not chat_exists:
        users_collection.update_one(
            {"userId": userId},
            {
                "$push": {
                    "chats": {
                        "chatId": chatId,
                        "messages": []
                    }
                }
            }
        )

    # 🔹 Save messages
    users_collection.update_one(
        {
            "userId": userId,
            "chats.chatId": chatId
        },
        {
            "$push": {
                "chats.$.messages": {
                    "$each": [
                        {"role": "user", "content": question},
                        {"role": "assistant", "content": text_response}
                    ]
                }
            }
        }
    )

    # 🔹 Return response
    return {
        "answer": text_response,
        "audio_url": f"/audio/{filename}"
    }


# 📥 Get Chats for User
@app.get("/get-chats")
def get_chats(userId: str):
    user = users_collection.find_one({"userId": userId})

    if not user:
        return {"chats": []}

    return {"chats": user.get("chats", [])}

@app.delete("/delete-chat")
async def delete_chat(request: Request):
    data = await request.json()

    userId = data.get("userId")
    chatId = data.get("chatId")

    if not userId:
        return {"status": "ignored"}  # guest user

    users_collection.update_one(
        {"userId": userId},
        {
            "$pull": {
                "chats": {"chatId": chatId}
            }
        }
    )

    return {"status": "deleted"}