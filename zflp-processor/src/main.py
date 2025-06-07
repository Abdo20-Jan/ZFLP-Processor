import os
import sys

# Configurar path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from flask import Flask, jsonify, request
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    # Configurar CORS
    CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    @app.route("/")
    def home():
        return jsonify({
            "message": "ZFLP Processor API - Argentina",
            "version": "2.0-production",
            "status": "online",
            "endpoints": {
                "health": "/health",
                "test": "/test"
            }
        })
    
    @app.route("/health")
    def health():
        return jsonify({
            "status": "healthy",
            "message": "Backend funcionando corretamente",
            "version": "2.0"
        })
    
    @app.route("/test")
    def test():
        return jsonify({
            "test": "success",
            "message": "API respondendo corretamente"
        })
    
    return app

# Para Railway
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
