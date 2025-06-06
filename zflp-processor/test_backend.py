#!/usr/bin/env python3
"""
Script de teste para o backend ZFLP Processor
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.services.excel_processor import ExcelProcessor
from src.services.pdf_generator import PDFGenerator
from src.services.excel_generator import ExcelGenerator

def test_excel_processor():
    """Testa o processador de Excel"""
    print("=== Testando Excel Processor ===")
    
    try:
        processor = ExcelProcessor()
        
        # Testar com arquivo de exemplo
        test_file = '/home/ubuntu/upload/PLANILHADEENTRADAZFLP20250603PSR.xlsx'
        
        if os.path.exists(test_file):
            print(f"Processando arquivo: {test_file}")
            result = processor.process_excel_file(test_file)
            
            print(f"Upload ID: {result['metadata']['upload_id']}")
            print(f"Produtos encontrados: {len(result['products'])}")
            print(f"Custos encontrados: {len(result['costs'])}")
            print(f"Resumo: {result['summary']}")
            
            # Testar validação
            errors = processor.validate_data(result)
            print(f"Erros de validação: {len(errors)}")
            if errors:
                for error in errors[:3]:  # Mostrar apenas os primeiros 3
                    print(f"  - {error}")
            
            print("✅ Excel Processor funcionando!")
            return result
        else:
            print(f"❌ Arquivo de teste não encontrado: {test_file}")
            return None
            
    except Exception as e:
        print(f"❌ Erro no Excel Processor: {str(e)}")
        return None

def test_pdf_generator(data):
    """Testa o gerador de PDF"""
    print("\n=== Testando PDF Generator ===")
    
    if not data:
        print("❌ Sem dados para testar PDF")
        return False
    
    try:
        generator = PDFGenerator()
        output_path = '/tmp/test_report.pdf'
        
        result_path = generator.generate_pdf(data, output_path)
        
        if os.path.exists(result_path):
            file_size = os.path.getsize(result_path)
            print(f"✅ PDF gerado: {result_path} ({file_size} bytes)")
            return True
        else:
            print("❌ PDF não foi criado")
            return False
            
    except Exception as e:
        print(f"❌ Erro no PDF Generator: {str(e)}")
        return False

def test_excel_generator(data):
    """Testa o gerador de Excel"""
    print("\n=== Testando Excel Generator ===")
    
    if not data:
        print("❌ Sem dados para testar Excel")
        return False
    
    try:
        generator = ExcelGenerator()
        output_path = '/tmp/test_report.xlsx'
        
        result_path = generator.generate_excel(data, output_path)
        
        if os.path.exists(result_path):
            file_size = os.path.getsize(result_path)
            print(f"✅ Excel gerado: {result_path} ({file_size} bytes)")
            
            # Testar template editável
            template_path = '/tmp/test_template.xlsx'
            template_result = generator.generate_editable_template(data, template_path)
            
            if os.path.exists(template_result):
                template_size = os.path.getsize(template_result)
                print(f"✅ Template editável gerado: {template_result} ({template_size} bytes)")
            
            return True
        else:
            print("❌ Excel não foi criado")
            return False
            
    except Exception as e:
        print(f"❌ Erro no Excel Generator: {str(e)}")
        return False

def test_flask_imports():
    """Testa se as importações do Flask estão funcionando"""
    print("\n=== Testando Importações Flask ===")
    
    try:
        from src.routes.upload import upload_bp
        print("✅ Rotas de upload importadas")
        
        from src.main import app
        print("✅ App Flask importado")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro nas importações Flask: {str(e)}")
        return False

def main():
    """Função principal de teste"""
    print("🚀 Iniciando testes do backend ZFLP Processor\n")
    
    # Testar componentes individuais
    data = test_excel_processor()
    test_pdf_generator(data)
    test_excel_generator(data)
    test_flask_imports()
    
    print("\n🎉 Testes concluídos!")

if __name__ == '__main__':
    main()

