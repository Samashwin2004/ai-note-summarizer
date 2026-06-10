from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from groq import Groq
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

# Initialize the Native Groq Cloud Client safely
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY")
)

class NoteInput(BaseModel):
    text: str

@app.post("/summarize")
async def summarize_note(input_data: NoteInput):
    if not input_data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return generate_bilingual_summary(input_data.text)

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    temp_file_path = f"temp_{file.filename}"
    
    try:
        # Read incoming media bytes straight from memory buffer safely
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
            
        # Send the audio file to Groq Whisper
        with open(temp_file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3", 
                file=audio_file,
                language="ta"  # Tamil/Tanglish processing configuration
            )
        
        transcript_text = transcription.text
        summary_data = generate_bilingual_summary(transcript_text)
        
        return {
            "transcript": transcript_text,
            "data": summary_data
        }

    except Exception as e:
        print(f"TRANSCRIBE ERROR LOG: {str(e)}")
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
        raise Exception(f"LLM Error: {str(e)}")