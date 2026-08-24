import os
import tempfile
import asyncio
from flask import Blueprint, request, send_file, jsonify
# pyrefly: ignore [missing-import]
import edge_tts

tts_bp = Blueprint('tts', __name__)

# Voice mapping based on user spec
VOICE_MAP = {
    'te': 'te-IN-ShrutiNeural',
    'ta': 'ta-IN-PallaviNeural',
    'hi': 'hi-IN-SwaraNeural'
}

async def generate_tts(text, voice, output_file):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)

@tts_bp.route('/', methods=['POST'])
def tts_generate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400
    
    text = data.get('text')
    language = data.get('language')
    
    if not text or not language:
        return jsonify({"error": "Missing 'text' or 'language'"}), 400
        
    voice = VOICE_MAP.get(language)
    if not voice:
        return jsonify({"error": f"Language '{language}' not supported by fallback TTS"}), 400
        
    try:
        # Create a temporary file for the audio output
        fd, output_path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)
        
        # Run async edge-tts generation synchronously for the Flask route
        asyncio.run(generate_tts(text, voice, output_path))
        
        # Return the audio file
        return send_file(
            output_path,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="speech.mp3"
        )
    except Exception as e:
        print(f"[AgriRisk Backend TTS] Error generating TTS: {str(e)}")
        return jsonify({"error": str(e)}), 500
