import React, { useState } from 'react';

export default function App() {
  // Input tracking
  const [text, setText] = useState('');
  
  // Network lifecycle tracking
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // The function that fires across the network bridge
  const handleSummarize = async () => {
    // 1. Guard against empty inputs
    if (!text.trim()) {
      setError("Please paste some text before attempting to summarize!");
      return;
    }

    // 2. Clear out any old states from previous clicks
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 3. Make the live network call to your hosted Render backend
      const response = await fetch('https://ai-note-summarizer-f6i6.onrender.com/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }), // Safely pack your active input text state
      });

      // 4. If the server threw an error code (like 400 or 500), read the error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Something went wrong on the server.");
      }

      // 5. Success! Parse the returned data structure
      const data = await response.json();
      setResult(data);

    } catch (err) {
      // Catch network drops or code failures
      setError(err.message);
    } finally {
      // 6. Turn off the loading spinner state regardless of success or failure
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '700px', margin: '40px auto', padding: '20px', color: '#333' }}>
      <h1>🧠 AI Note Summarizer</h1>
      <p style={{ color: '#666' }}>Paste your meeting minutes or raw study notes to generate structured layouts.</p>
      
      {/* Text Area Input */}
      <textarea
        rows="10"
        style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        placeholder="Type or paste your notes here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />

      {/* Conditional Error Display */}
      {error && (
        <div style={{ color: '#dc3545', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '6px', marginTop: '10px', fontWeight: '500' }}>
          ⚠️ Error: {error}
        </div>
      )}

      {/* Trigger Button */}
      <button 
        onClick={handleSummarize}
        disabled={loading}
        style={{ 
          marginTop: '12px', padding: '12px 24px', fontSize: '16px', 
          background: loading ? '#9eccfa' : '#0070f3', color: 'white', 
          border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold', width: '100%'
        }}
      >
        {loading ? 'Processing through AI Brain...' : 'Summarize Note ✨'}
      </button>

      {/* --- RESULTS PANEL AREA --- */}
      {result && (
        <div style={{ marginTop: '30px', borderTop: '2px solid #eaeaea', paddingTop: '20px' }}>
          <h2>🎯 Analysis Results</h2>
          
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#0070f3' }}>Summary</h3>
            <p style={{ lineHeight: '1.6' }}>{result.summary}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ color: '#28a745' }}>📝 Action Items</h3>
              <ul>
                {result.action_items && result.action_items.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px', lineHeight: '1.4' }}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#6f42c1' }}>⚖️ Key Decisions</h3>
              <ul>
                {result.key_decisions && result.key_decisions.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px', lineHeight: '1.4' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}