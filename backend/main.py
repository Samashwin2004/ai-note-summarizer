from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

# --- CORS MIDDLEWARE SECURITY BRIDGE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Initialize the Groq Cloud SDK Client
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("GROQ_API_KEY")
)

# Request schema for incoming frontend note packages
class NoteInput(BaseModel):
    text: str

@app.post("/summarize")
async def summarize_note(input_data: NoteInput):
    if not input_data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # Requesting completion matrix from Groq using the active supported model
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",  # <-- Updated to active model identifier
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert assistant. Summarize the text into clear sections: Summary, Action Items, and Key Decisions. Respond in structured JSON matching fields: summary (string), action_items (list of strings), key_decisions (list of strings)."
                },
                {
                    "role": "user", 
                    "content": input_data.text
                }
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))