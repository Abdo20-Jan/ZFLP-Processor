import xlsxwriter
from typing import Dict, List, Any
import os
from datetime import datetime


class ExcelGenerator:
    """Gerador de Excel com fórmulas para dados de importação ZFLP"""
    
    def __init__(self):
        self.workbook = None
        self.worksheet = None
        self.formats = {}
    
    def generate_excel(self, data: Dict[str, Any], output_path: str) -> str:
        """
        Gera arquivo Excel formatado com fórmulas
        
        Args:
            data: Dados processados da planilha
            output_path: Caminho para salvar o Excel
            
        Returns:
            Caminho do arquivo Excel gerado
        """
        try:
            # Criar workbook
            self.workbook = xlsxwriter.Workbook(output_path)
            self.worksheet = self.workbook.add_worksheet('Relatório ZFLP')
            
            # Configurar formatos
            self._setup_formats()
            
            # Configurar página para impressão
            self._setup_page_format()
            
            # Construir planilha
            current_row = 0
            
            # Cabeçalho
            current_row = self._build_header(data, current_row)
            
            # Resumo financeiro
            current_row = self._build_summary_section(data, current_row)
            
            # Tabela de produtos
            current_row = self._build_products_section(data, current_row)
            
            # Custos operacionais
            current_row = self._build_costs_section(data, current_row)
            
            # Totais finais
            current_row = self._build_totals_section(data, current_row)
            
            # Fechar workbook
            self.workbook.close()
            
            return output_path
            
        except Exception as e:
            if self.workbook:
                self.workbook.close()
            raise Exception(f"Erro ao gerar Excel: {str(e)}")
    
    def _setup_formats(self):
        """Configura formatos para células"""
        # Formato para títulos
        self.formats['title'] = self.workbook.add_format({
            'bold': True,
            'font_size': 14,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#1e40af',
            'font_color': 'white',
            'border': 1
        })
        
        # Formato para subtítulos
        self.formats['subtitle'] = self.workbook.add_format({
            'bold': True,
            'font_size': 12,
            'align': 'left',
            'valign': 'vcenter',
            'bg_color': '#64748b',
            'font_color': 'white',
            'border': 1
        })
        
        # Formato para cabeçalhos de tabela
        self.formats['header'] = self.workbook.add_format({
            'bold': True,
            'font_size': 10,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#e2e8f0',
            'border': 1
        })
        
        # Formato para dados normais
        self.formats['data'] = self.workbook.add_format({
            'font_size': 10,
            'align': 'left',
            'valign': 'vcenter',
            'border': 1
        })
        
        # Formato para números
        self.formats['number'] = self.workbook.add_format({
            'font_size': 10,
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.00',
            'border': 1
        })
        
        # Formato para moeda brasileira
        self.formats['currency_brl'] = self.workbook.add_format({
            'font_size': 10,
            'align': 'right',
            'valign': 'vcenter',
            'num_format': 'R$ #,##0.00',
            'border': 1
        })
        
        # Formato para moeda americana
        self.formats['currency_usd'] = self.workbook.add_format({
            'font_size': 10,
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '$ #,##0.00',
            'border': 1
        })
        
        # Formato para percentual
        self.formats['percent'] = self.workbook.add_format({
            'font_size': 10,
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '0.0000%',
            'border': 1
        })
        
        # Formato para totais
        self.formats['total'] = self.workbook.add_format({
            'bold': True,
            'font_size': 10,
            'align': 'right',
            'valign': 'vcenter',
            'bg_color': '#fef3c7',
            'border': 2
        })
        
        # Formato para total final
        self.formats['final_total'] = self.workbook.add_format({
            'bold': True,
            'font_size': 12,
            'align': 'right',
            'valign': 'vcenter',
            'bg_color': '#fbbf24',
            'border': 2,
            'num_format': 'R$ #,##0.00'
        })
    
    def _setup_page_format(self):
        """Configura formato da página para impressão"""
        # Configurar para papel ofício (216x330mm) em modo retrato
        self.worksheet.set_paper(9)  # A4 (mais próximo do ofício)
        self.worksheet.set_portrait()
        
        # Configurar margens (em polegadas)
        self.worksheet.set_margins(0.79, 0.79, 0.79, 0.79)  # ~20mm
        
        # Configurar cabeçalho e rodapé
        metadata = {}
        self.worksheet.set_header(
            f'&C&14&B RELATÓRIO DE IMPORTAÇÃO - ZFLP'
        )
        self.worksheet.set_footer(
            f'&L Gerado em: {datetime.now().strftime("%d/%m/%Y %H:%M")} &R Página &P de &N'
        )
        
        # Configurar larguras das colunas
        self.worksheet.set_column('A:A', 25)  # Descrição/Produto
        self.worksheet.set_column('B:B', 12)  # Quantidade
        self.worksheet.set_column('C:C', 15)  # Valores
        self.worksheet.set_column('D:D', 15)  # Totais
        self.worksheet.set_column('E:E', 15)  # Extra
    
    def _build_header(self, data: Dict[str, Any], start_row: int) -> int:
        """Constrói cabeçalho da planilha"""
        current_row = start_row
        
        # Título principal
        self.worksheet.merge_range(
            current_row, 0, current_row, 4,
            'RELATÓRIO DE IMPORTAÇÃO - ZFLP',
            self.formats['title']
        )
        current_row += 2
        
        # Informações do documento
        metadata = data.get('metadata', {})
        filename = metadata.get('filename', 'N/A')
        processed_at = metadata.get('processed_at', datetime.now().isoformat())
        
        # Formatar data
        try:
            date_obj = datetime.fromisoformat(processed_at.replace('Z', '+00:00'))
            formatted_date = date_obj.strftime('%d/%m/%Y %H:%M')
        except:
            formatted_date = processed_at
        
        self.worksheet.write(current_row, 0, 'Arquivo:', self.formats['data'])
        self.worksheet.write(current_row, 1, filename, self.formats['data'])
        current_row += 1
        
        self.worksheet.write(current_row, 0, 'Processado em:', self.formats['data'])
        self.worksheet.write(current_row, 1, formatted_date, self.formats['data'])
        current_row += 2
        
        return current_row
    
    def _build_summary_section(self, data: Dict[str, Any], start_row: int) -> int:
        """Constrói seção de resumo financeiro"""
        current_row = start_row
        summary = data.get('summary', {})
        
        if not summary:
            return current_row
        
        # Título da seção
        self.worksheet.merge_range(
            current_row, 0, current_row, 4,
            'RESUMO FINANCEIRO',
            self.formats['subtitle']
        )
        current_row += 1
        
        # Cabeçalhos
        self.worksheet.write(current_row, 0, 'Item', self.formats['header'])
        self.worksheet.write(current_row, 1, 'Valor (R$)', self.formats['header'])
        current_row += 1
        
        # Dados do resumo
        summary_start_row = current_row
        
        if 'mercadoria' in summary:
            self.worksheet.write(current_row, 0, 'Mercadoria', self.formats['data'])
            self.worksheet.write(current_row, 1, summary['mercadoria'], self.formats['currency_brl'])
            current_row += 1
        
        if 'frete_seguro' in summary:
            self.worksheet.write(current_row, 0, 'Frete + Seguro', self.formats['data'])
            self.worksheet.write(current_row, 1, summary['frete_seguro'], self.formats['currency_brl'])
            current_row += 1
        
        if 'cif' in summary:
            self.worksheet.write(current_row, 0, 'CIF', self.formats['data'])
            self.worksheet.write(current_row, 1, summary['cif'], self.formats['currency_brl'])
            current_row += 1
        
        if 'custo_total' in summary:
            self.worksheet.write(current_row, 0, 'Custo Total', self.formats['data'])
            self.worksheet.write(current_row, 1, summary['custo_total'], self.formats['currency_brl'])
            current_row += 1
        
        current_row += 1
        return current_row
    
    def _build_products_section(self, data: Dict[str, Any], start_row: int) -> int:
        """Constrói seção de produtos"""
        current_row = start_row
        products = data.get('products', [])
        
        if not products:
            return current_row
        
        # Título da seção
        self.worksheet.merge_range(
            current_row, 0, current_row, 4,
            'PRODUTOS IMPORTADOS',
            self.formats['subtitle']
        )
        current_row += 1
        
        # Cabeçalhos
        self.worksheet.write(current_row, 0, 'Produto', self.formats['header'])
        self.worksheet.write(current_row, 1, 'Quantidade', self.formats['header'])
        self.worksheet.write(current_row, 2, 'FOB (US$)', self.formats['header'])
        self.worksheet.write(current_row, 3, 'Total (US$)', self.formats['header'])
        current_row += 1
        
        # Dados dos produtos
        products_start_row = current_row
        
        for product in products:
            self.worksheet.write(current_row, 0, product.get('produto', ''), self.formats['data'])
            self.worksheet.write(current_row, 1, product.get('quantidade', 0), self.formats['number'])
            self.worksheet.write(current_row, 2, product.get('fob', 0), self.formats['currency_usd'])
            
            # Fórmula para calcular total (Quantidade * FOB)
            formula = f'=B{current_row+1}*C{current_row+1}'
            self.worksheet.write_formula(current_row, 3, formula, self.formats['currency_usd'])
            
            current_row += 1
        
        # Linha de totais
        self.worksheet.write(current_row, 0, 'TOTAL', self.formats['total'])
        
        # Fórmula para somar quantidades
        qty_formula = f'=SUM(B{products_start_row+1}:B{current_row})'
        self.worksheet.write_formula(current_row, 1, qty_formula, self.formats['total'])
        
        self.worksheet.write(current_row, 2, '', self.formats['total'])
        
        # Fórmula para somar totais
        total_formula = f'=SUM(D{products_start_row+1}:D{current_row})'
        self.worksheet.write_formula(current_row, 3, total_formula, self.formats['total'])
        
        current_row += 2
        return current_row
    
    def _build_costs_section(self, data: Dict[str, Any], start_row: int) -> int:
        """Constrói seção de custos operacionais"""
        current_row = start_row
        costs = data.get('costs', [])
        
        if not costs:
            return current_row
        
        # Título da seção
        self.worksheet.merge_range(
            current_row, 0, current_row, 4,
            'CUSTOS OPERACIONAIS',
            self.formats['subtitle']
        )
        current_row += 1
        
        # Cabeçalhos
        self.worksheet.write(current_row, 0, 'Item de Custo', self.formats['header'])
        self.worksheet.write(current_row, 1, 'Percentual (%)', self.formats['header'])
        self.worksheet.write(current_row, 2, 'Valor (R$)', self.formats['header'])
        current_row += 1
        
        # Dados dos custos
        costs_start_row = current_row
        
        for cost in costs:
            self.worksheet.write(current_row, 0, cost.get('item', ''), self.formats['data'])
            
            # Percentual (converter de decimal para percentual)
            percentual = cost.get('percentual', 0) / 100 if cost.get('percentual', 0) > 0 else 0
            if percentual > 0:
                self.worksheet.write(current_row, 1, percentual, self.formats['percent'])
            else:
                self.worksheet.write(current_row, 1, '-', self.formats['data'])
            
            self.worksheet.write(current_row, 2, cost.get('valor', 0), self.formats['currency_brl'])
            
            current_row += 1
        
        # Linha de total de custos
        self.worksheet.write(current_row, 0, 'TOTAL CUSTOS', self.formats['total'])
        self.worksheet.write(current_row, 1, '', self.formats['total'])
        
        # Fórmula para somar custos
        costs_formula = f'=SUM(C{costs_start_row+1}:C{current_row})'
        self.worksheet.write_formula(current_row, 2, costs_formula, self.formats['total'])
        
        current_row += 2
        return current_row
    
    def _build_totals_section(self, data: Dict[str, Any], start_row: int) -> int:
        """Constrói seção de totais finais"""
        current_row = start_row
        totals = data.get('totals', {})
        
        if not totals:
            return current_row
        
        # Título da seção
        self.worksheet.merge_range(
            current_row, 0, current_row, 4,
            'TOTAIS CONSOLIDADOS',
            self.formats['subtitle']
        )
        current_row += 1
        
        # Cabeçalhos
        self.worksheet.write(current_row, 0, 'Descrição', self.formats['header'])
        self.worksheet.write(current_row, 1, 'Valor', self.formats['header'])
        current_row += 1
        
        # Dados dos totais
        if 'total_produtos' in totals:
            self.worksheet.write(current_row, 0, 'Total Produtos (US$)', self.formats['data'])
            self.worksheet.write(current_row, 1, totals['total_produtos'], self.formats['currency_usd'])
            current_row += 1
        
        if 'total_quantidade' in totals:
            self.worksheet.write(current_row, 0, 'Total Quantidade', self.formats['data'])
            self.worksheet.write(current_row, 1, f"{totals['total_quantidade']} unidades", self.formats['data'])
            current_row += 1
        
        if 'total_custos' in totals:
            self.worksheet.write(current_row, 0, 'Total Custos (R$)', self.formats['data'])
            self.worksheet.write(current_row, 1, totals['total_custos'], self.formats['currency_brl'])
            current_row += 1
        
        if 'custo_total' in totals:
            self.worksheet.write(current_row, 0, 'CUSTO TOTAL FINAL (R$)', self.formats['data'])
            self.worksheet.write(current_row, 1, totals['custo_total'], self.formats['final_total'])
            current_row += 1
        
        current_row += 1
        return current_row
    
    def generate_editable_template(self, data: Dict[str, Any], output_path: str) -> str:
        """
        Gera template editável com fórmulas dinâmicas
        
        Args:
            data: Dados processados
            output_path: Caminho para salvar o Excel
            
        Returns:
            Caminho do arquivo Excel gerado
        """
        try:
            self.workbook = xlsxwriter.Workbook(output_path)
            self.worksheet = self.workbook.add_worksheet('Template Editável')
            
            self._setup_formats()
            self._setup_page_format()
            
            current_row = 0
            
            # Instruções
            self.worksheet.merge_range(
                current_row, 0, current_row, 4,
                'TEMPLATE EDITÁVEL - ZFLP (Modifique os valores conforme necessário)',
                self.formats['title']
            )
            current_row += 2
            
            # Seção de produtos editável
            current_row = self._build_editable_products_section(data, current_row)
            
            # Seção de custos editável
            current_row = self._build_editable_costs_section(data, current_row)
            
            # Totais com fórmulas dinâmicas
            current_row = self._build_dynamic_totals_section(current_row)
            
            self.workbook.close()
            return output_path
            
        except Exception as e:
            if self.workbook:
                self.workbook.close()
            raise Exception(f"Erro ao gerar template editável: {str(e)}")
    
    def _build_editable_products_section(self, data: Dict[str, Any], start_row: int) -> int:
        """Constrói seção editável de produtos"""
        current_row = start_row
        products = data.get('products', [])
        
        # Título
        self.worksheet.merge_range(
            current_row, 0, current_row, 4,
            'PRODUTOS (Editável)',
            self.formats['subtitle']
        )
        current_row += 1
        
        # Cabeçalhos
        self.worksheet.write(current_row, 0, 'Produto', self.formats['header'])
        self.worksheet.write(current_row, 1, 'Quantidade', self.formats['header'])
        self.worksheet.write(current_row, 2, 'FOB (US$)', self.formats['header'])
        self.worksheet.write(current_row, 3, 'Total (US$)', self.formats['header'])
        current_row += 1
        
        # Produtos com células editáveis
        products_start = current_row
        for i, product in enumerate(products[:20]):  # Máximo 20 produtos
            self.worksheet.write(current_row, 0, product.get('produto', ''), self.formats['data'])
            self.worksheet.write(current_row, 1, product.get('quantidade', 0), self.formats['number'])
            self.worksheet.write(current_row, 2, product.get('fob', 0), self.formats['currency_usd'])
            
            # Fórmula dinâmica para total
            formula = f'=B{current_row+1}*C{current_row+1}'
            self.worksheet.write_formula(current_row, 3, formula, self.formats['currency_usd'])
            
            current_row += 1
        
        # Adicionar linhas vazias para novos produtos
        for i in range(5):
            self.worksheet.write(current_row, 0, '', self.formats['data'])
            self.worksheet.write(current_row, 1, 0, self.formats['number'])
            self.worksheet.write(current_row, 2, 0, self.formats['currency_usd'])
            
            formula = f'=B{current_row+1}*C{current_row+1}'
            self.worksheet.write_formula(current_row, 3, formula, self.formats['currency_usd'])
            
            current_row += 1
        
        # Total de produtos
        self.worksheet.write(current_row, 0, 'TOTAL PRODUTOS', self.formats['total'])
        qty_formula = f'=SUM(B{products_start+1}:B{current_row})'
        self.worksheet.write_formula(current_row, 1, qty_formula, self.formats['total'])
        self.worksheet.write(current_row, 2, '', self.formats['total'])
        total_formula = f'=SUM(D{products_start+1}:D{current_row})'
        self.worksheet.write_formula(current_row, 3, total_formula, self.formats['total'])
        
        current_row += 2
        return current_row
    
    def _build_editable_costs_section(self, data: Dict[str, Any], start_row: int) -> int:
        """Constrói seção editável de custos"""
        current_row = start_row
        costs = data.get('costs', [])
        
        # Título
        self.worksheet.merge_range(
            current_row, 0, current_row, 4,
            'CUSTOS OPERACIONAIS (Editável)',
            self.formats['subtitle']
        )
        current_row += 1
        
        # Cabeçalhos
        self.worksheet.write(current_row, 0, 'Item de Custo', self.formats['header'])
        self.worksheet.write(current_row, 1, 'Percentual (%)', self.formats['header'])
        self.worksheet.write(current_row, 2, 'Valor (R$)', self.formats['header'])
        current_row += 1
        
        # Custos com células editáveis
        costs_start = current_row
        for cost in costs[:15]:  # Máximo 15 custos
            self.worksheet.write(current_row, 0, cost.get('item', ''), self.formats['data'])
            
            percentual = cost.get('percentual', 0) / 100 if cost.get('percentual', 0) > 0 else 0
            self.worksheet.write(current_row, 1, percentual, self.formats['percent'])
            self.worksheet.write(current_row, 2, cost.get('valor', 0), self.formats['currency_brl'])
            
            current_row += 1
        
        # Adicionar linhas vazias para novos custos
        for i in range(5):
            self.worksheet.write(current_row, 0, '', self.formats['data'])
            self.worksheet.write(current_row, 1, 0, self.formats['percent'])
            self.worksheet.write(current_row, 2, 0, self.formats['currency_brl'])
            current_row += 1
        
        # Total de custos
        self.worksheet.write(current_row, 0, 'TOTAL CUSTOS', self.formats['total'])
        self.worksheet.write(current_row, 1, '', self.formats['total'])
        costs_formula = f'=SUM(C{costs_start+1}:C{current_row})'
        self.worksheet.write_formula(current_row, 2, costs_formula, self.formats['total'])
        
        current_row += 2
        return current_row
    
    def _build_dynamic_totals_section(self, start_row: int) -> int:
        """Constrói seção de totais com fórmulas dinâmicas"""
        current_row = start_row
        
        # Título
        self.worksheet.merge_range(
            current_row, 0, current_row, 4,
            'TOTAIS AUTOMÁTICOS',
            self.formats['subtitle']
        )
        current_row += 1
        
        # Instruções
        self.worksheet.write(current_row, 0, 'Os totais abaixo são calculados automaticamente', self.formats['data'])
        current_row += 2
        
        # Totais dinâmicos (referências devem ser ajustadas conforme a estrutura real)
        self.worksheet.write(current_row, 0, 'CUSTO TOTAL FINAL (R$)', self.formats['data'])
        # Esta fórmula deve ser ajustada conforme a localização real dos totais
        self.worksheet.write(current_row, 1, 'Ajustar fórmula conforme necessário', self.formats['final_total'])
        
        current_row += 1
        return current_row

