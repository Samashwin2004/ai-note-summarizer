from fastapi.testclient import TestClient
from main import app

# 1. Create a virtual client that can interact with our FastAPI app
client = TestClient(app)

# Test 1: Verify the welcome root endpoint returns HTTP 200 OK
def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Backend server is up and running with Mock AI!"}

# Test 2: Verify that sending valid text returns our structured summary object
def test_summarize_success():
    payload = {"text": "This is a long test note about engineering project timelines."}
    response = client.post("/summarize", json=payload)
    
    # Asserting means "Check if this statement is absolutely True"
    assert response.status_code == 200
    
    data = response.json()
    assert "summary" in data
    assert "action_items" in data
    assert "key_decisions" in data
    assert len(data["action_items"]) > 0

# Test 3: Verify that sending empty text triggers a 400 Bad Request error
def test_summarize_empty_text():
    payload = {"text": "   "} # Sending blank white spaces
    response = client.post("/summarize", json=payload)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Text cannot be empty."