import pytest
from unittest.mock import patch, MagicMock
from requests.exceptions import Timeout, RequestException
import requests
from backend.services.translation_service import translate_text, check_health, _translation_cache
from app import create_app

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture(autouse=True)
def clear_cache():
    _translation_cache.clear()
    yield

# Test 1-3: Valid translations
@patch('backend.services.translation_service.requests.post')
def test_valid_translation(mock_post, client):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"translatedText": "வணக்கம்"}
    mock_post.return_value = mock_resp
    
    # Tamil
    res = translate_text("Hello", "en", "ta")
    assert res["success"] is True
    assert res["translated_text"] == "வணக்கம்"
    
    # Telugu
    mock_resp.json.return_value = {"translatedText": "నమస్కారం"}
    res2 = translate_text("Hello", "en", "te")
    assert res2["translated_text"] == "నమస్కారం"

    # Hindi
    mock_resp.json.return_value = {"translatedText": "नमस्ते"}
    res3 = translate_text("Hello", "en", "hi")
    assert res3["translated_text"] == "नमस्ते"

# Test 4: Same language returns original
def test_same_language_returns_original():
    res = translate_text("High weather risk", "en", "en")
    assert res["success"] is True
    assert res["translated_text"] == "High weather risk"

# Test 5: Empty text rejected
def test_empty_text():
    res = translate_text("", "en", "ta")
    assert res["success"] is False
    assert "Invalid text" in res["error"]

# Test 7: Unavailable
@patch('backend.services.translation_service.requests.post')
def test_libretranslate_unavailable(mock_post):
    mock_post.side_effect = RequestException("Connection Error")
    res = translate_text("Test", "en", "ta")
    assert res["success"] is False
    assert "unavailable" in res["error"].lower()

# Test 8: Timeout
@patch('backend.services.translation_service.requests.post')
def test_libretranslate_timeout(mock_post):
    mock_post.side_effect = Timeout("Timeout")
    res = translate_text("Test", "en", "ta")
    assert res["success"] is False
    assert "temporarily unavailable" in res["error"].lower()

# Test 9: Cache works
@patch('backend.services.translation_service.requests.post')
def test_translation_cache(mock_post):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"translatedText": "Translated"}
    mock_post.return_value = mock_resp
    
    # First call
    res1 = translate_text("Cache Test", "en", "ta")
    assert mock_post.call_count == 1
    
    # Second call - should use cache
    res2 = translate_text("Cache Test", "en", "ta")
    assert mock_post.call_count == 1 # Still 1
    assert res1["translated_text"] == res2["translated_text"]

# Test API Route
@patch('backend.services.translation_service.requests.post')
def test_translation_route(mock_post, client):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"translatedText": "API Translated"}
    mock_post.return_value = mock_resp
    
    response = client.post('/api/translation/translate', json={
        "text": "Hello API",
        "source": "en",
        "target": "hi"
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["translated_text"] == "API Translated"

# Test API Error Handling (No text)
def test_translation_route_no_text(client):
    response = client.post('/api/translation/translate', json={"target": "ta"})
    assert response.status_code == 400

# Test Health Route
@patch('backend.services.translation_service.requests.get')
def test_health_route(mock_get, client):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_get.return_value = mock_resp
    
    response = client.get('/api/translation/health')
    assert response.status_code == 200
    assert response.get_json()["available"] is True
