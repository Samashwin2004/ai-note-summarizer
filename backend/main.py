from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

# --- HEALTH CHECK ENDPOINT (To verify Render deployment) ---
@app.get("/")
async def root():
    return {"status": "healthy", "service": "Bilingual AI Engine alive"}

# --- CORS MIDDLEWARE SECURITY BRIDGE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Initialize Groq Client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY environment variable is not set!")

client = Groq(api_key=GROQ_API_KEY)

class NoteInput(BaseModel):
    text: str

@app.post("/summarize")
async def summarize_note(input_data: NoteInput):
    if not input_data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return generate_bilingual_summary(input_data.text)

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Use explicit absolute pathing to prevent temporary write tracking failures on cloud environments
    temp_file_path = os.path.abspath(f"temp_{file.filename}")
    
    try:
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
            
        with open(temp_file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3", 
                file=audio_file,
                language="ta"
            )
        
        transcript_text = transcription.text
        summary_data = generate_bilingual_summary(transcript_text)
        
        return {
            "transcript": transcript_text,
            "data": summary_data
        }
    except Exception as e:
        print(f"TRANSCRIBE SYSTEM FAULT ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def generate_bilingual_summary(text_content: str):
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "You are an assistant processing order records. Analyze the text and generate a summary, "
                        "action items, and key decisions. You MUST provide the output in BOTH English and Tamil. "
                        "Respond strictly in JSON matching this exact key structure:\n"
                        "{\n"
                        "  \"summary_en\": \"English summary here\",\n"
                        "  \"summary_ta\": \"Tamil summary here\",\n"
                        "  \"action_items_en\": [\"Item 1\", \"Item 2\"],\n"
                        "  \"action_items_ta\": [\"தமிழ் உருப்படி 1\", \"தமிழ் உருப்படி 2\"],\n"
                        "  \"key_decisions_en\": [\"Decision 1\"],\n"
                        "  \"key_decisions_ta\": [\"தீர்மானம் 1\"]\n"
                        "}"
                    )
                },
                {"role": "user", "content": text_content}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"GROQ LLM PROCESS EXCEPTION: {str(e)}")
        # Safe structural fallback to prevent backend crashing if JSON validation acts up
        return {
            "summary_en": "Processing error occurred.",
            "summary_ta": "செயலாக்க பிழை ஏற்பட்டது.",
            "action_items_en": [], "action_items_ta": [],
            "key_decisions_en": [], "key_decisions_ta": []
        }