import React, { useState, useRef } from 'react';

export default function App() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const BACKEND_URL = 'https://ai-note-summarizer-f6i6.onrender.com';

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError("Please paste text or record audio first!");
      return;
    }
    setLoading(true); setResult(null); setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) throw new Error("Server communication fault.");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone connectivity rejected.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setLoading(true); setResult(null);
    const formData = new FormData();
    formData.append("file", audioBlob, "user_voice.wav");

    try {
      const response = await fetch(`${BACKEND_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Audio conversion matrix failed.");
      const data = await response.json();
      setText(data.transcript);
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); transform: scale(1); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div style={styles.headerSection}>
        <span style={styles.badge}>🇮🇳 BILINGUAL ENGINE ALIVE</span>
        <h1 style={styles.title}>🧠 AI Voice Note Summarizer</h1>
        <p style={styles.subtitle}>
          Record voice commands directly. The AI will preserve your speech and extract analytics in both languages.
        </p>
      </div>

      <div style={styles.mainCard}>
        <div style={styles.voiceRow}>
          {!isRecording ? (
            <button onClick={startRecording} disabled={loading} style={loading ? styles.btnDisabled : styles.btnMicStart}>
              🎤 Start Speaking (Tamil/Tanglish)
            </button>
          ) : (
            <button onClick={stopRecording} style={styles.btnMicStop}>
              🔴 Recording Audio... Click to End
            </button>
          )}
        </div>

        <textarea
          rows="6"
          style={styles.textarea}
          placeholder="Audio transcription text will stream into here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />

        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

        <button 
          onClick={handleSummarize}
          disabled={loading || isRecording}
          style={(loading || isRecording) ? styles.btnActionDisabled : styles.btnActionActive}
        >
          {loading ? 'Processing Data Structures...' : 'Analyze Text Note ✨'}
        </button>
      </div>

      {result && (
        <div style={styles.resultsContainer}>
          
          {/* --- ENGLISH LAYOUT COLUMN --- */}
          <h2 style={styles.sectionHeading}>🇬🇧 English Summary Analytics</h2>
          <div style={styles.summaryBoxEn}>
            <p style={styles.boxBodyText}>{result.summary_en}</p>
          </div>
          <div style={styles.gridSplit}>
            <div style={styles.cardBox}>
              <h4 style={{color:'#2563eb', margin:'0 0 10px 0'}}>📝 Action Items</h4>
              <ul>{result.action_items_en?.map((item, i) => <li key={i} style={styles.listItem}>{item}</li>)}</ul>
            </div>
            <div style={styles.cardBox}>
              <h4 style={{color:'#7c3aed', margin:'0 0 10px 0'}}>⚖️ Key Decisions</h4>
              <ul>{result.key_decisions_en?.map((item, i) => <li key={i} style={styles.listItem}>{item}</li>)}</ul>
            </div>
          </div>

          <div style={{margin: '40px 0', borderTop: '2px dashed #cbd5e1'}} />

          {/* --- TAMIL LAYOUT COLUMN --- */}
          <h2 style={styles.sectionHeading}>🇮🇳 தமிழ் சுருக்கம் (Tamil Summary)</h2>
          <div style={styles.summaryBoxTa}>
            <p style={styles.boxBodyText}>{result.summary_ta}</p>
          </div>
          <div style={styles.gridSplit}>
            <div style={styles.cardBox}>
              <h4 style={{color:'#16a34a', margin:'0 0 10px 0'}}>📝 செய்ய வேண்டியவை (Actions)</h4>
              <ul>{result.action_items_ta?.map((item, i) => <li key={i} style={styles.listItem}>{item}</li>)}</ul>
            </div>
            <div style={styles.cardBox}>
              <h4 style={{color:'#ea580c', margin:'0 0 10px 0'}}>⚖️ முக்கிய முடிவுகள் (Decisions)</h4>
              <ul>{result.key_decisions_ta?.map((item, i) => <li key={i} style={styles.listItem}>{item}</li>)}</ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: '850px', margin: '40px auto', padding: '0 20px', backgroundColor: '#f8fafc' },
  headerSection: { textAlign: 'center', marginBottom: '30px' },
  badge: { backgroundColor: '#ffedd5', color: '#ea580c', padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' },
  title: { fontSize: '32px', color: '#0f172a', marginTop: '12px', fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: '15px', lineHeight: '1.5' },
  mainCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  voiceRow: { display: 'flex', justifyContent: 'center', marginBottom: '15px' },
  btnMicStart: { padding: '12px 24px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' },
  btnMicStop: { padding: '12px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', animation: 'pulseGlow 1.5s infinite ease-in-out' },
  btnDisabled: { padding: '12px 24px', background: '#cbd5e1', color: '#94a3b8', border: 'none', borderRadius: '10px', cursor: 'not-allowed' },
  textarea: { width: '100%', padding: '14px', fontSize: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f8fafc' },
  errorAlert: { color: '#b91c1c', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', marginTop: '12px' },
  btnActionActive: { marginTop: '15px', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', width: '100%' },
  btnActionDisabled: { marginTop: '15px', padding: '14px', background: '#e2e8f0', color: '#64748b', border: 'none', borderRadius: '10px', width: '100%', animation: 'shimmer 1.5s infinite linear' },
  resultsContainer: { marginTop: '35px', paddingBottom: '50px' },
  sectionHeading: { fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '15px' },
  summaryBoxEn: { backgroundColor: '#eff6ff', borderLeft: '5px solid #2563eb', padding: '15px', borderRadius: '0 10px 10px 0', marginBottom: '15px' },
  summaryBoxTa: { backgroundColor: '#f0fdf4', borderLeft: '5px solid #16a34a', padding: '15px', borderRadius: '0 10px 10px 0', marginBottom: '15px' },
  boxBodyText: { margin: 0, lineHeight: '1.6', color: '#334155', fontSize: '15px' },
  gridSplit: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  cardBox: { backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  listItem: { color: '#475569', fontSize: '14px', marginBottom: '6px', lineHeight: '1.4' }
};