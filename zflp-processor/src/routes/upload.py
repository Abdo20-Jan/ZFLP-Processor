from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
import json
import logging
from datetime import datetime
from services.excel_processor_robust import robust_processor
from database_argentina import (
    PNEU_DATABASE_REAL, 
    MARCAS_REAIS,
    APLICACOES_REAIS,
    CUSTOS_FIXOS_ARGENTINA, 
    CUSTOS_VARIAVEIS_ARGENTINA, 
    TRIBUTOS_ARGENTINA,
    NCM_PNEUS
)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

upload_bp = Blueprint("upload", __name__)

def log_request(endpoint: str, data: dict = None):
    """Log detalhado de requisições"""
    logger.info(f"[{datetime.now()}] {endpoint} - Data: {data}")

def create_error_response(error_msg: str, stage: str = "unknown", details: dict = None):
    """Criar resposta de erro padronizada"""
    response = {
        "success": False,
        "error": error_msg,
        "stage": stage,
        "timestamp": datetime.now().isoformat()
    }
    if details:
        response["details"] = details
    
    logger.error(f"Erro em {stage}: {error_msg}")
    return jsonify(response)

def create_success_response(data: dict, message: str = "Sucesso"):
    """Criar resposta de sucesso padronizada"""
    response = {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }
    return jsonify(response)

@upload_bp.route("/upload", methods=["POST", "OPTIONS"])
def upload_file():
    """Upload e processamento de arquivo Excel - ULTRA ROBUSTO"""
    try:
        log_request("upload")
        
        if request.method == "OPTIONS":
            return jsonify({"success": True}), 200
        
        if 'file' not in request.files:
            return create_error_response("Nenhum arquivo enviado", "file_validation")
        
        file = request.files["file"]
        
        if file.filename == '':
            return create_error_response("Nenhum arquivo selecionado", "file_validation")
        
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            return create_error_response(
                "Formato de arquivo inválido. Use .xlsx ou .xls", 
                "file_format"
            )
        
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        result = robust_processor.process_file(file_path)
        
        # Limpar arquivo temporário
        os.remove(file_path)
        os.rmdir(temp_dir)
        
        return create_success_response(result, "Arquivo processado com sucesso")
        
    except Exception as e:
        logger.error(f"Erro crítico no upload: {e}")
        return create_error_response(
            f"Erro crítico no servidor: {str(e)}", 
            "server_error"
        ), 500

@upload_bp.route("/manual-entry", methods=["POST", "OPTIONS"])
def manual_entry():
    """Entrada manual de produtos"""
    try:
        log_request("manual_entry")
        
        if request.method == "OPTIONS":
            return jsonify({"success": True}), 200
        
        data = request.get_json()
        if not data:
            return create_error_response("Dados não fornecidos", "json_validation")
        
        products = data.get('products', [])
        
        if not products:
            return create_error_response("Lista de produtos vazia", "data_validation")
        
        # Processar produtos
        processed_products = []
        total_value = 0
        
        for product in products:
            try:
                processed = {
                    "name": product.get('produto', ''),
                    "brand": product.get('marca', ''),
                    "quantity": float(product.get('quantidade', 0)),
                    "unit_cost": float(product.get('valorFornecedor', 0)),
                    "total": float(product.get('quantidade', 0)) * float(product.get('valorFornecedor', 0))
                }
                processed_products.append(processed)
                total_value += processed['total']
            except (ValueError, TypeError) as e:
                logger.warning(f"Erro ao processar produto: {product} - {e}")
                continue
        
        result = {
            "products": processed_products,
            "summary": {
                "total_products": len(processed_products),
                "total_value": round(total_value, 2),
                "currency": "USD"
            }
        }
        
        return create_success_response(result, "Produtos processados com sucesso")
        
    except Exception as e:
        logger.error(f"Erro na entrada manual: {e}")
        return create_error_response(
            f"Erro no servidor: {str(e)}", 
            "server_error"
        ), 500

@upload_bp.route("/calculate-costs", methods=["POST", "OPTIONS"])
def calculate_costs():
    """Calcular pro-rateio de custos com CIF/FOB - ULTRA ROBUSTO"""
    try:
        log_request("calculate_costs")
        
        if request.method == "OPTIONS":
            return jsonify({"success": True}), 200
        
        data = request.get_json()
        if not data:
            return create_error_response("Dados não fornecidos", "json_validation")
        
        # Extrair dados
        products = data.get('products', [])
        fixed_costs = data.get('fixedCosts', [])
        variable_costs = data.get('variableCosts', [])
        taxes = data.get('taxes', [])
        freight_value = float(data.get('freightValue', 0))
        insurance_percentage = float(data.get('insurancePercentage', 0))
        
        if not products:
            return create_error_response("Lista de produtos vazia", "data_validation")
        
        # Calcular valores base
        total_products = sum(float(p.get('total', 0)) for p in products)
        insurance_value = total_products * insurance_percentage / 100
        cif_value = total_products + freight_value + insurance_value
        
        # Calcular custos fixos
        total_fixed = 0
        for cost in fixed_costs:
            if cost.get('activo', False):
                if cost.get('tipo') == 'porcentaje':
                    base = cif_value if cost.get('base') == 'CIF' else total_products
                    total_fixed += base * float(cost.get('valor', 0)) / 100
                else:
                    total_fixed += float(cost.get('valor', 0))
        
        # Calcular custos variáveis
        total_variable = 0
        for cost in variable_costs:
            if cost.get('activo', False):
                if cost.get('tipo') == 'porcentaje':
                    base = cif_value if cost.get('base') == 'CIF' else total_products
                    total_variable += base * float(cost.get('valor', 0)) / 100
                else:
                    total_variable += float(cost.get('valor', 0))
        
        # Calcular tributos
        total_taxes = 0
        for tax in taxes:
            if tax.get('activo', False):
                if tax.get('tipo') == 'porcentaje':
                    base = cif_value if tax.get('base') == 'CIF' else total_products
                    total_taxes += base * float(tax.get('valor', 0)) / 100
                else:
                    total_taxes += float(tax.get('valor', 0))
        
        # Custo total
        total_cost = total_products + freight_value + insurance_value + total_fixed + total_variable + total_taxes
        
        # Pro-rateio
        rateio = []
        for product in products:
            try:
                product_value = float(product.get('total', 0))
                participation = product_value / total_products if total_products > 0 else 0
                allocated_cost = total_cost * participation
                quantity = float(product.get('quantity', product.get('quantidade', 1)))
                unit_cost = allocated_cost / quantity if quantity > 0 else 0
                
                rateio.append({
                    'name': product.get('name', product.get('produto', '')),
                    'brand': product.get('brand', product.get('marca', '')),
                    'quantity': quantity,
                    'unit_cost_original': float(product.get('unit_cost', product.get('valorFornecedor', 0))),
                    'value_original': product_value,
                    'participation': round(participation * 100, 2),
                    'allocated_cost': round(allocated_cost, 2),
                    'unit_cost_final': round(unit_cost, 2)
                })
            except (ValueError, TypeError):
                continue
        
        result = {
            "calculation": {
                "total_products": round(total_products, 2),
                "freight_value": round(freight_value, 2),
                "insurance_percentage": insurance_percentage,
                "insurance_value": round(insurance_value, 2),
                "cif_value": round(cif_value, 2),
                "total_fixed": round(total_fixed, 2),
                "total_variable": round(total_variable, 2),
                "total_taxes": round(total_taxes, 2),
                "total_cost": round(total_cost, 2),
                "rateio": rateio
            }
        }
        
        logger.info(f"Cálculo concluído. Custo total: ${total_cost:.2f}")
        
        return create_success_response(
            result,
            "Cálculo de custos realizado com sucesso!"
        )
        
    except Exception as e:
        logger.error(f"Erro crítico no cálculo de custos: {e}")
        return create_error_response(
            f"Erro crítico no servidor: {str(e)}", 
            "server_error"
        ), 500

@upload_bp.route("/suggestions/<suggestion_type>", methods=["GET"])
def get_suggestions(suggestion_type):
    """Obter sugestões por tipo"""
    try:
        suggestions_map = {
            'products': PNEU_DATABASE_REAL[:50],  # Primeiros 50
            'brands': MARCAS_REAIS,
            'fixed_costs': [cost['nome'] for cost in CUSTOS_FIXOS_ARGENTINA],
            'variable_costs': [cost['nome'] for cost in CUSTOS_VARIAVEIS_ARGENTINA],
            'taxes': [tax['nome'] for tax in TRIBUTOS_ARGENTINA]
        }
        
        if suggestion_type not in suggestions_map:
            return create_error_response("Tipo de sugestão inválido", "invalid_type")
        
        return create_success_response({
            "suggestions": suggestions_map[suggestion_type],
            "type": suggestion_type,
            "count": len(suggestions_map[suggestion_type])
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter sugestões: {e}")
        return create_error_response(
            f"Erro no servidor: {str(e)}", 
            "server_error"
        ), 500

@upload_bp.route("/search-products", methods=["GET"])
def search_products():
    """Buscar produtos por termo"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 20))
        
        if not query or len(query) < 2:
            return create_success_response({
                "products": [],
                "total": 0,
                "query": query
            })
        
        query_lower = query.lower()
        filtered_products = [
            product for product in PNEU_DATABASE_REAL 
            if query_lower in product.lower()
        ]
        
        limited_products = filtered_products[:limit]
        
        return create_success_response({
            "products": limited_products,
            "total": len(filtered_products),
            "query": query,
            "showing": len(limited_products)
        })
        
    except Exception as e:
        logger.error(f"Erro na busca de produtos: {e}")
        return create_error_response(
            f"Erro no servidor: {str(e)}", 
            "server_error"
        ), 500

@upload_bp.route("/health", methods=["GET"])
def health_check():
    """Verificação de saúde da API"""
    return create_success_response({
        "status": "healthy",
        "database_products": len(PNEU_DATABASE_REAL),
        "database_brands": len(MARCAS_REAIS),
        "version": "2.0-robust"
    }, "API funcionando corretamente")
