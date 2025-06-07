import pandas as pd
import numpy as np
import os
import logging
from typing import Dict, List, Any, Optional, Tuple
import re
from decimal import Decimal, InvalidOperation

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RobustExcelProcessor:
    """
    Processador de Excel ultra-robusto com validação completa
    """
    
    def __init__(self):
        self.supported_formats = ['.xlsx', '.xls', '.csv']
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        self.max_rows = 10000
        
        # Padrões para detecção de colunas
        self.column_patterns = {
            'produto': [
                r'produto', r'product', r'item', r'descrição', r'description', 
                r'nome', r'name', r'artigo', r'article', r'mercadoria'
            ],
            'marca': [
                r'marca', r'brand', r'fabricante', r'manufacturer', 
                r'fornecedor', r'supplier', r'make'
            ],
            'quantidade': [
                r'quantidade', r'qtd', r'qty', r'quantity', r'quant', 
                r'unidades', r'units', r'pcs', r'peças'
            ],
            'valor': [
                r'valor', r'price', r'preço', r'preco', r'custo', r'cost', 
                r'unitário', r'unit', r'valor_unit', r'unit_price'
            ]
        }
    
    def validate_file(self, file_path: str) -> Tuple[bool, str]:
        """Validar arquivo antes do processamento"""
        try:
            # Verificar se arquivo existe
            if not os.path.exists(file_path):
                return False, "Arquivo não encontrado"
            
            # Verificar tamanho do arquivo
            file_size = os.path.getsize(file_path)
            if file_size > self.max_file_size:
                return False, f"Arquivo muito grande. Máximo: {self.max_file_size/1024/1024:.1f}MB"
            
            if file_size == 0:
                return False, "Arquivo está vazio"
            
            # Verificar extensão
            _, ext = os.path.splitext(file_path)
            if ext.lower() not in self.supported_formats:
                return False, f"Formato não suportado. Use: {', '.join(self.supported_formats)}"
            
            return True, "Arquivo válido"
            
        except Exception as e:
            logger.error(f"Erro na validação do arquivo: {e}")
            return False, f"Erro na validação: {str(e)}"
    
    def read_excel_file(self, file_path: str) -> Tuple[Optional[pd.DataFrame], str]:
        """Ler arquivo Excel com múltiplas tentativas"""
        try:
            # Tentar diferentes engines e configurações
            read_attempts = [
                {'engine': 'openpyxl', 'sheet_name': 0},
                {'engine': 'xlrd', 'sheet_name': 0},
                {'engine': None, 'sheet_name': 0},  # Auto-detect
            ]
            
            for attempt in read_attempts:
                try:
                    logger.info(f"Tentando ler com configuração: {attempt}")
                    df = pd.read_excel(file_path, **attempt)
                    
                    if not df.empty:
                        logger.info(f"Arquivo lido com sucesso. Shape: {df.shape}")
                        return df, "Sucesso"
                        
                except Exception as e:
                    logger.warning(f"Tentativa falhou: {e}")
                    continue
            
            # Se Excel falhar, tentar como CSV
            try:
                logger.info("Tentando ler como CSV")
                df = pd.read_csv(file_path, encoding='utf-8', sep=None, engine='python')
                if not df.empty:
                    return df, "Lido como CSV"
            except Exception as e:
                logger.warning(f"Leitura como CSV falhou: {e}")
            
            return None, "Não foi possível ler o arquivo com nenhum método"
            
        except Exception as e:
            logger.error(f"Erro crítico na leitura: {e}")
            return None, f"Erro crítico: {str(e)}"
    
    def clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Limpar e preparar DataFrame"""
        try:
            logger.info(f"Limpando DataFrame. Shape inicial: {df.shape}")
            
            # Remover linhas completamente vazias
            df = df.dropna(how='all')
            
            # Remover colunas completamente vazias
            df = df.dropna(axis=1, how='all')
            
            # Limitar número de linhas
            if len(df) > self.max_rows:
                logger.warning(f"Arquivo muito grande. Limitando a {self.max_rows} linhas")
                df = df.head(self.max_rows)
            
            # Limpar nomes das colunas
            df.columns = [str(col).strip().lower() for col in df.columns]
            
            # Preencher valores NaN
            df = df.fillna('')
            
            logger.info(f"DataFrame limpo. Shape final: {df.shape}")
            return df
            
        except Exception as e:
            logger.error(f"Erro na limpeza do DataFrame: {e}")
            raise
    
    def detect_columns_robust(self, df: pd.DataFrame) -> Dict[str, str]:
        """Detectar colunas com algoritmo robusto"""
        try:
            columns = df.columns.tolist()
            logger.info(f"Detectando colunas em: {columns}")
            
            mapping = {}
            
            for target_col, patterns in self.column_patterns.items():
                best_match = None
                best_score = 0
                
                for col in columns:
                    col_clean = str(col).lower().strip()
                    
                    # Calcular score de similaridade
                    score = 0
                    for pattern in patterns:
                        if re.search(pattern, col_clean):
                            score += 10  # Match exato
                        elif pattern in col_clean:
                            score += 5   # Match parcial
                        elif any(word in col_clean for word in pattern.split()):
                            score += 2   # Match de palavra
                    
                    if score > best_score:
                        best_score = score
                        best_match = col
                
                if best_match and best_score > 0:
                    mapping[target_col] = best_match
                    logger.info(f"Coluna '{target_col}' mapeada para '{best_match}' (score: {best_score})")
            
            # Validar mapeamento mínimo
            required_cols = ['produto', 'quantidade', 'valor']
            missing_cols = [col for col in required_cols if col not in mapping]
            
            if missing_cols:
                logger.warning(f"Colunas obrigatórias não encontradas: {missing_cols}")
                # Tentar mapeamento por posição
                if len(columns) >= 3:
                    mapping.update({
                        'produto': columns[0],
                        'quantidade': columns[-2] if len(columns) > 2 else columns[1],
                        'valor': columns[-1]
                    })
                    if len(columns) >= 4:
                        mapping['marca'] = columns[1]
            
            logger.info(f"Mapeamento final: {mapping}")
            return mapping
            
        except Exception as e:
            logger.error(f"Erro na detecção de colunas: {e}")
            return {}
    
    def parse_numeric_value(self, value: Any) -> float:
        """Parser numérico ultra-robusto"""
        try:
            if pd.isna(value) or value == '' or value is None:
                return 0.0
            
            # Se já é número
            if isinstance(value, (int, float)):
                return float(value) if not pd.isna(value) else 0.0
            
            # Converter para string e limpar
            str_value = str(value).strip()
            
            if not str_value:
                return 0.0
            
            # Remover símbolos de moeda e espaços
            cleaned = re.sub(r'[^\d.,\-+]', '', str_value)
            
            if not cleaned:
                return 0.0
            
            # Lidar com diferentes formatos decimais
            if ',' in cleaned and '.' in cleaned:
                # Determinar qual é o separador decimal
                last_comma = cleaned.rfind(',')
                last_dot = cleaned.rfind('.')
                
                if last_comma > last_dot:
                    # Formato: 1.234,56
                    cleaned = cleaned.replace('.', '').replace(',', '.')
                else:
                    # Formato: 1,234.56
                    cleaned = cleaned.replace(',', '')
            elif ',' in cleaned:
                # Verificar se é decimal ou milhares
                parts = cleaned.split(',')
                if len(parts) == 2 and len(parts[1]) <= 2 and parts[1].isdigit():
                    # Provavelmente decimal: 12,34
                    cleaned = cleaned.replace(',', '.')
                else:
                    # Provavelmente milhares: 1,234
                    cleaned = cleaned.replace(',', '')
            
            # Tentar conversão com Decimal para maior precisão
            try:
                decimal_value = Decimal(cleaned)
                return float(decimal_value)
            except InvalidOperation:
                pass
            
            # Fallback para float direto
            return float(cleaned)
            
        except (ValueError, TypeError, InvalidOperation) as e:
            logger.warning(f"Erro ao converter '{value}' para número: {e}")
            return 0.0
    
    def validate_product_data(self, product: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """Validar dados de um produto"""
        try:
            errors = []
            validated_product = {}
            
            # Validar nome do produto
            name = str(product.get('name', '')).strip()
            if not name or len(name) < 2:
                errors.append("Nome do produto inválido")
            else:
                validated_product['name'] = name[:200]  # Limitar tamanho
            
            # Validar marca
            brand = str(product.get('brand', '')).strip()
            validated_product['brand'] = brand[:100] if brand else ''
            
            # Validar quantidade
            quantity = self.parse_numeric_value(product.get('quantity', 0))
            if quantity <= 0:
                errors.append("Quantidade deve ser maior que zero")
            elif quantity > 1000000:
                errors.append("Quantidade muito alta")
            else:
                validated_product['quantity'] = quantity
            
            # Validar valor unitário
            unit_cost = self.parse_numeric_value(product.get('unit_cost', 0))
            if unit_cost <= 0:
                errors.append("Valor unitário deve ser maior que zero")
            elif unit_cost > 1000000:
                errors.append("Valor unitário muito alto")
            else:
                validated_product['unit_cost'] = round(unit_cost, 2)
            
            # Calcular total
            if 'quantity' in validated_product and 'unit_cost' in validated_product:
                validated_product['total'] = round(validated_product['quantity'] * validated_product['unit_cost'], 2)
            
            # Verificar se tem erros
            if errors:
                return False, "; ".join(errors), {}
            
            return True, "Produto válido", validated_product
            
        except Exception as e:
            logger.error(f"Erro na validação do produto: {e}")
            return False, f"Erro na validação: {str(e)}", {}
    
    def process_file(self, file_path: str) -> Dict[str, Any]:
        """Processar arquivo com validação completa"""
        try:
            logger.info(f"Iniciando processamento de: {file_path}")
            
            # 1. Validar arquivo
            is_valid, validation_msg = self.validate_file(file_path)
            if not is_valid:
                return {
                    "success": False,
                    "error": validation_msg,
                    "stage": "file_validation"
                }
            
            # 2. Ler arquivo
            df, read_msg = self.read_excel_file(file_path)
            if df is None:
                return {
                    "success": False,
                    "error": f"Erro na leitura: {read_msg}",
                    "stage": "file_reading"
                }
            
            # 3. Limpar dados
            df = self.clean_dataframe(df)
            
            if df.empty:
                return {
                    "success": False,
                    "error": "Arquivo não contém dados válidos",
                    "stage": "data_cleaning"
                }
            
            # 4. Detectar colunas
            column_mapping = self.detect_columns_robust(df)
            
            required_cols = ['produto', 'quantidade', 'valor']
            missing_cols = [col for col in required_cols if col not in column_mapping]
            
            if missing_cols:
                return {
                    "success": False,
                    "error": f"Colunas obrigatórias não encontradas: {missing_cols}. Colunas disponíveis: {list(df.columns)}",
                    "stage": "column_detection",
                    "available_columns": list(df.columns),
                    "detected_mapping": column_mapping
                }
            
            # 5. Processar produtos
            products = []
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Extrair dados da linha
                    raw_product = {
                        'name': row.get(column_mapping.get('produto', ''), ''),
                        'brand': row.get(column_mapping.get('marca', ''), ''),
                        'quantity': row.get(column_mapping.get('quantidade', ''), 0),
                        'unit_cost': row.get(column_mapping.get('valor', ''), 0)
                    }
                    
                    # Validar produto
                    is_valid, error_msg, validated_product = self.validate_product_data(raw_product)
                    
                    if is_valid:
                        products.append(validated_product)
                    else:
                        errors.append(f"Linha {index + 2}: {error_msg}")
                        
                except Exception as e:
                    errors.append(f"Linha {index + 2}: Erro no processamento - {str(e)}")
                    continue
            
            # 6. Validar resultado final
            if not products:
                return {
                    "success": False,
                    "error": "Nenhum produto válido encontrado",
                    "stage": "product_validation",
                    "errors": errors[:10],  # Limitar erros mostrados
                    "total_errors": len(errors)
                }
            
            # 7. Calcular estatísticas
            total_value = sum(p['total'] for p in products)
            avg_price = total_value / len(products) if products else 0
            
            result = {
                "success": True,
                "products": products,
                "summary": {
                    "total_products": len(products),
                    "total_value": round(total_value, 2),
                    "average_price": round(avg_price, 2),
                    "currency": "USD"
                },
                "processing_info": {
                    "file_read_method": read_msg,
                    "columns_detected": column_mapping,
                    "total_rows_processed": len(df),
                    "valid_products": len(products),
                    "errors_count": len(errors),
                    "errors": errors[:5] if errors else []  # Mostrar apenas primeiros 5 erros
                }
            }
            
            logger.info(f"Processamento concluído. {len(products)} produtos válidos de {len(df)} linhas")
            return result
            
        except Exception as e:
            logger.error(f"Erro crítico no processamento: {e}")
            return {
                "success": False,
                "error": f"Erro crítico no processamento: {str(e)}",
                "stage": "critical_error"
            }

# Instância global para uso
robust_processor = RobustExcelProcessor()
