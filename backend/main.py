import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI  # We still use this library because Groq is fully compatible!

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- UPDATED FOR GROQ ---
# We fetch the Groq key and point the client directly to Groq's free cloud gateway
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("Missing GROQ_API_KEY inside your .env file!")

ai_client = OpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1"  # <-- This redirects requests to Groq!
)
# ------------------------

class NoteInput(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Backend server is live and connected to Groq AI!"}

@app.post("/summarize")
def summarize_note(input_data: NoteInput):
    if not input_data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    try:
        system_instruction = (
            "You are an expert assistant. Summarize the provided text. "
            "You MUST return your response in a strict, clean JSON format with exactly three keys: "
            "'summary' (a paragraph analyzing the input text), "
            "'action_items' (a list of strings representing bullet tasks found in the text), "
            "and 'key_decisions' (a list of strings representing main conclusions found in the text)."
        )

        # --- UPDATED MODEL NAME ---
        response = ai_client.chat.completions.create(
            model="llama-3.3-70b-versatile", # Highly intelligent, ultra-fast free model
            response_format={ "type": "json_object" }, 
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": input_data.text}
            ]
        )
        # ---------------------------

        ai_response_text = response.choices[0].message.content
        return json.loads(ai_response_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine failed: {str(e)}")