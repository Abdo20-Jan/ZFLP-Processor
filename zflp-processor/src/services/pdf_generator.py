from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from typing import Dict, List, Any
import os
from datetime import datetime


class PDFGenerator:
    """Gerador de PDF para relatórios de importação ZFLP"""
    
    def __init__(self):
        # Tamanho papel ofício em mm: 216x330
        self.page_size = (216*mm, 330*mm)
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configura estilos customizados para o PDF"""
        # Estilo para título principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=14,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.black
        ))
        
        # Estilo para subtítulos
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=8,
            alignment=TA_LEFT,
            textColor=colors.black
        ))
        
        # Estilo para texto normal
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=4,
            alignment=TA_LEFT
        ))
        
        # Estilo para valores monetários
        self.styles.add(ParagraphStyle(
            name='Currency',
            parent=self.styles['Normal'],
            fontSize=9,
            alignment=TA_RIGHT
        ))
    
    def generate_pdf(self, data: Dict[str, Any], output_path: str) -> str:
        """
        Gera PDF formatado com os dados processados
        
        Args:
            data: Dados processados da planilha
            output_path: Caminho para salvar o PDF
            
        Returns:
            Caminho do arquivo PDF gerado
        """
        try:
            # Criar documento PDF
            doc = SimpleDocTemplate(
                output_path,
                pagesize=self.page_size,
                rightMargin=20*mm,
                leftMargin=20*mm,
                topMargin=20*mm,
                bottomMargin=20*mm
            )
            
            # Construir conteúdo
            story = []
            
            # Cabeçalho
            story.extend(self._build_header(data))
            
            # Resumo financeiro
            story.extend(self._build_summary_section(data))
            
            # Tabela de produtos
            story.extend(self._build_products_section(data))
            
            # Custos operacionais
            story.extend(self._build_costs_section(data))
            
            # Totais finais
            story.extend(self._build_totals_section(data))
            
            # Rodapé
            story.extend(self._build_footer(data))
            
            # Gerar PDF
            doc.build(story)
            
            return output_path
            
        except Exception as e:
            raise Exception(f"Erro ao gerar PDF: {str(e)}")
    
    def _build_header(self, data: Dict[str, Any]) -> List:
        """Constrói cabeçalho do documento"""
        elements = []
        
        # Título principal
        title = Paragraph("RELATÓRIO DE IMPORTAÇÃO - ZFLP", self.styles['CustomTitle'])
        elements.append(title)
        
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
        
        info_text = f"<b>Arquivo:</b> {filename}<br/><b>Processado em:</b> {formatted_date}"
        info_para = Paragraph(info_text, self.styles['CustomNormal'])
        elements.append(info_para)
        
        elements.append(Spacer(1, 12))
        
        return elements
    
    def _build_summary_section(self, data: Dict[str, Any]) -> List:
        """Constrói seção de resumo financeiro"""
        elements = []
        
        summary = data.get('summary', {})
        if not summary:
            return elements
        
        # Título da seção
        subtitle = Paragraph("RESUMO FINANCEIRO", self.styles['CustomSubtitle'])
        elements.append(subtitle)
        
        # Dados do resumo
        summary_data = [
            ['Item', 'Valor (R$)']
        ]
        
        if 'mercadoria' in summary:
            summary_data.append(['Mercadoria', f"R$ {summary['mercadoria']:,.2f}"])
        
        if 'frete_seguro' in summary:
            summary_data.append(['Frete + Seguro', f"R$ {summary['frete_seguro']:,.2f}"])
        
        if 'cif' in summary:
            summary_data.append(['CIF', f"R$ {summary['cif']:,.2f}"])
        
        if 'custo_total' in summary:
            summary_data.append(['Custo Total', f"R$ {summary['custo_total']:,.2f}"])
        
        # Criar tabela
        summary_table = Table(summary_data, colWidths=[120*mm, 60*mm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 12))
        
        return elements
    
    def _build_products_section(self, data: Dict[str, Any]) -> List:
        """Constrói seção de produtos"""
        elements = []
        
        products = data.get('products', [])
        if not products:
            return elements
        
        # Título da seção
        subtitle = Paragraph("PRODUTOS IMPORTADOS", self.styles['CustomSubtitle'])
        elements.append(subtitle)
        
        # Cabeçalho da tabela
        products_data = [
            ['Produto', 'Qnt', 'FOB (US$)', 'Total (US$)']
        ]
        
        # Adicionar produtos
        for product in products:
            products_data.append([
                product.get('produto', ''),
                str(product.get('quantidade', 0)),
                f"$ {product.get('fob', 0):.2f}",
                f"$ {product.get('total', 0):,.2f}"
            ])
        
        # Calcular totais
        total_qty = sum(p.get('quantidade', 0) for p in products)
        total_value = sum(p.get('total', 0) for p in products)
        
        products_data.append([
            'TOTAL',
            str(total_qty),
            '',
            f"$ {total_value:,.2f}"
        ])
        
        # Criar tabela
        products_table = Table(products_data, colWidths=[100*mm, 20*mm, 30*mm, 30*mm])
        products_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(products_table)
        elements.append(Spacer(1, 12))
        
        return elements
    
    def _build_costs_section(self, data: Dict[str, Any]) -> List:
        """Constrói seção de custos operacionais"""
        elements = []
        
        costs = data.get('costs', [])
        if not costs:
            return elements
        
        # Título da seção
        subtitle = Paragraph("CUSTOS OPERACIONAIS", self.styles['CustomSubtitle'])
        elements.append(subtitle)
        
        # Cabeçalho da tabela
        costs_data = [
            ['Item de Custo', 'Percentual (%)', 'Valor (R$)']
        ]
        
        # Adicionar custos
        for cost in costs:
            costs_data.append([
                cost.get('item', ''),
                f"{cost.get('percentual', 0):.4f}%" if cost.get('percentual', 0) > 0 else '-',
                f"R$ {cost.get('valor', 0):,.2f}"
            ])
        
        # Calcular total de custos
        total_costs = sum(c.get('valor', 0) for c in costs)
        costs_data.append([
            'TOTAL CUSTOS',
            '',
            f"R$ {total_costs:,.2f}"
        ])
        
        # Criar tabela
        costs_table = Table(costs_data, colWidths=[100*mm, 40*mm, 40*mm])
        costs_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(costs_table)
        elements.append(Spacer(1, 12))
        
        return elements
    
    def _build_totals_section(self, data: Dict[str, Any]) -> List:
        """Constrói seção de totais finais"""
        elements = []
        
        totals = data.get('totals', {})
        if not totals:
            return elements
        
        # Título da seção
        subtitle = Paragraph("TOTAIS CONSOLIDADOS", self.styles['CustomSubtitle'])
        elements.append(subtitle)
        
        # Dados dos totais
        totals_data = [
            ['Descrição', 'Valor']
        ]
        
        if 'total_produtos' in totals:
            totals_data.append(['Total Produtos (US$)', f"$ {totals['total_produtos']:,.2f}"])
        
        if 'total_quantidade' in totals:
            totals_data.append(['Total Quantidade', f"{totals['total_quantidade']:,} unidades"])
        
        if 'total_custos' in totals:
            totals_data.append(['Total Custos (R$)', f"R$ {totals['total_custos']:,.2f}"])
        
        if 'custo_total' in totals:
            totals_data.append(['CUSTO TOTAL FINAL (R$)', f"R$ {totals['custo_total']:,.2f}"])
        
        # Criar tabela
        totals_table = Table(totals_data, colWidths=[120*mm, 60*mm])
        totals_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.yellow),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(totals_table)
        elements.append(Spacer(1, 12))
        
        return elements
    
    def _build_footer(self, data: Dict[str, Any]) -> List:
        """Constrói rodapé do documento"""
        elements = []
        
        # Linha separadora
        elements.append(Spacer(1, 20))
        
        # Informações do rodapé
        footer_text = """
        <br/>
        <i>Relatório gerado automaticamente pelo Sistema de Processamento ZFLP</i><br/>
        <i>Para dúvidas ou correções, entre em contato com o setor responsável.</i>
        """
        
        footer_para = Paragraph(footer_text, self.styles['CustomNormal'])
        elements.append(footer_para)
        
        return elements
    
    def generate_summary_pdf(self, data: Dict[str, Any], output_path: str) -> str:
        """
        Gera PDF resumido (apenas totais principais)
        
        Args:
            data: Dados processados
            output_path: Caminho para salvar o PDF
            
        Returns:
            Caminho do arquivo PDF gerado
        """
        try:
            doc = SimpleDocTemplate(
                output_path,
                pagesize=self.page_size,
                rightMargin=20*mm,
                leftMargin=20*mm,
                topMargin=20*mm,
                bottomMargin=20*mm
            )
            
            story = []
            
            # Cabeçalho
            story.extend(self._build_header(data))
            
            # Apenas resumo e totais
            story.extend(self._build_summary_section(data))
            story.extend(self._build_totals_section(data))
            
            # Rodapé
            story.extend(self._build_footer(data))
            
            doc.build(story)
            return output_path
            
        except Exception as e:
            raise Exception(f"Erro ao gerar PDF resumido: {str(e)}")

