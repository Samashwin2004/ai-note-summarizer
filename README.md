AI Note Summarizer
A full-stack, cloud-deployed AI productivity tool that transforms unstructured meeting minutes, messy lecture notes, or raw text blocks into highly organized summaries, actionable lists, and key decisions. Built using a decoupled client-server architecture and powered by ultra-fast Groq Cloud inference engines.

Live Frontend: https://ai-note-summarizer-yr4t.vercel.app
Live Backend API: https://ai-note-summarizer-f6i6.onrender.com

Key Features
Real-time AI Processing: Fast token handling using high-speed Llama models.

Structured Layout System: Automatically organizes text blocks into distinct sections (Summary, Action Items, Key Decisions).

Clean User Interface: Built with a minimalist, non-blocking React container.

Production-Gated Security: Hidden system credentials via server environment variables.

The Tech Stack
Frontend (Client-Side)
React (Vite): Powering the UI elements, form tracking, and app lifecycle state hooks.

Asynchronous Fetch API: Handshaking request packages over the internet via secure JSON streams.

Hosting: Hosted on Vercel with automatic deployment tracking via git.

Backend (Server API)
FastAPI (Python): High-performance, lightweight REST API handling incoming client endpoints.

CORS Middleware Engines: Configured to allow cross-origin browser communication seamlessly between independent servers.

Hosting: Hosted on Render's cloud infrastructure platform.

AI Core Layer
Groq Cloud API SDK: Interfacing directly with high-performance Llama hardware processing models.

Active Engine Model: llama-3.1-8b-instant executing exact structured JSON schema formatting specifications.

Project Directory Breakdown
ai-note-summarizer/
├── frontend/               # React User Interface App (Vercel)
│   ├── src/
│   │   ├── App.jsx        # Component managing input text and HTTP requests
│   │   └── main.jsx
│   └── package.json
└── backend/                # Python REST API Server (Render)
├── main.py             # Server routes, CORS configuration, and AI logic
└── .env.example        # Environment variable reference

How Data Travels Through the App (The Lifecycle)
When you type notes into the input box and click the process button, the data moves through a complete architectural loop:

[ Browser / Frontend ]
│

▼ (1) POST Request sent to the Render Backend URL path /summarize
[ Render Cloud Network ]
│

▼ (2) Inside backend directory, passes through CORS security middleware
[ FastAPI App (main.py) ]
│

▼ (3) Attaches secret GROQ_API_KEY and requests Llama-3.1 model
[ Groq AI Cloud Servers ]
│

▼ (4) Generates structural JSON strings
[ FastAPI App (main.py) ]
│

▼ (5) Parses JSON text and returns clean data arrays to frontend
[ Browser / Frontend ]
│

▼ (6) React maps result.summary, result.action_items, and result.key_decisions into UI cards

User Action: The user pastes messy text into the React textarea layout and clicks the button.

The Request: The browser packages the raw text inside an HTTP POST body structure and shoots it to the Render URL path (/summarize).

The Gating: The FastAPI application accepts the text packet, clears browser CORS restrictions, and safely injects your secret backend environment token (GROQ_API_KEY).

The Processing: The prompt is sent to Groq Cloud servers, telling the llama-3.1-8b-instant model to parse the note contents strictly into clean JSON structures.

The Display: The backend returns the structural object to the browser. React catches the summary, array lists, and items, instantly loading them into clean layout cards.

Real-World Engineering Hurdles Dealt With
CORS Blockades: Handled domain security restrictions across mismatched cloud environments (vercel.app vs. onrender.com) by injecting FastAPI CORSMiddleware.

API Key Extraction: Protected third-party API limits by moving key requests exclusively to an isolated server layer.

Model Migrations: Updated runtime settings instantly when the base model was deprecated by modifying strings directly in production configurations
