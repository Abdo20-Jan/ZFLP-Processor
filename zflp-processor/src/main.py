import os
import sys
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv( )

# Configurar path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from flask import Flask, jsonify, request
from flask_cors import CORS
from routes.upload import upload_bp

def create_app():
    app = Flask(__name__)
    
    # Configurar CORS para produção
    cors_origins = os.getenv('CORS_ORIGINS', '*').split(',')
    CORS(app, 
         origins=cors_origins,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"])
    
    # Registrar blueprints
    app.register_blueprint(upload_bp, url_prefix="/api")
    
    @app.route("/")
    def home():
        return jsonify({
            "message": "ZFLP Processor API - Argentina",
            "version": "2.0-production",
            "status": "online",
            "endpoints": {
                "upload": "/api/upload",
                "manual_entry": "/api/manual-entry",
                "calculate_costs": "/api/calculate-costs",
                "search_products": "/api/search-products",
                "health": "/api/health"
            }
        })
    
    @app.route("/health")
    def health():
        try:
            from database_argentina import PNEU_DATABASE_REAL, MARCAS_REAIS
            return jsonify({
                "status": "healthy",
                "products_count": len(PNEU_DATABASE_REAL),
                "brands_count": len(MARCAS_REAIS),
                "environment": os.getenv('FLASK_ENV', 'development')
            })
        except Exception as e:
            return jsonify({"status": "error", "error": str(e)}), 500
    
    return app

# Para Railway/Render
app = create_app()

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )
