from flask import Blueprint, request, jsonify
from backend.services.translation_service import translate_text, check_health

translation_bp = Blueprint('translation', __name__)

@translation_bp.route('/translate', methods=['POST'])
def translate():
    """
    Translates text using LibreTranslate.
    Expected JSON body: { "text": "...", "source": "en", "target": "ta" }
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400
        
    text = data.get('text')
    source = data.get('source', 'en')
    target = data.get('target')
    
    if not text:
        return jsonify({"success": False, "error": "Missing 'text' field"}), 400
    if not target:
        return jsonify({"success": False, "error": "Missing 'target' field"}), 400
        
    # Check if text is too long (e.g., > 5000 characters to prevent abuse)
    if len(text) > 5000:
        return jsonify({"success": False, "error": "Text too long"}), 400
        
    result = translate_text(text, source, target)
    return jsonify(result), 200 if result["success"] else 503

@translation_bp.route('/health', methods=['GET'])
def health():
    """Health check for LibreTranslate"""
    return jsonify(check_health())
