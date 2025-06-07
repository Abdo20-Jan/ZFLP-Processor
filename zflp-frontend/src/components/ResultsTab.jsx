import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Eye, TrendingUp, Package } from 'lucide-react';

const ResultsTab = ({ calculationResults, onExport }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!calculationResults) {
    return (
      <div className="text-center py-12">
        <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum cálculo realizado
        </h3>
        <p className="text-gray-600">
          Complete as etapas anteriores para ver os resultados
        </p>
      </div>
    );
  }

  const {
    totalProdutos,
    totalCustosFijos,
    totalCostosVariables,
    totalTributos,
    costoTotal,
    rateio
  } = calculationResults;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resultados Finais</h2>
        <p className="text-gray-600">Pro-rateio de custos calculado automaticamente</p>
      </div>

      {/* Resumo Executivo */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Resumo Executivo
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${totalProdutos.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Produtos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${totalCustosFijos.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Custos Fixos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${(totalCostosVariables + totalTributos).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Variáveis + Tributos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ${costoTotal.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">TOTAL</div>
          </div>
        </div>
      </div>

      {/* Detalhamento de Custos */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Detalhamento de Custos</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            {showDetails ? 'Ocultar' : 'Ver'} Detalhes
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
            <span className="font-medium">Produtos Base</span>
            <span className="font-bold text-blue-600">${totalProdutos.toFixed(2)}</span>
          </div>
          
          {showDetails && (
            <>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <span className="font-medium">Custos Fixos</span>
                <span className="font-bold text-orange-600">${totalCustosFijos.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="font-medium">Custos Variáveis</span>
                <span className="font-bold text-purple-600">${totalCostosVariables.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="font-medium">Tributos</span>
                <span className="font-bold text-red-600">${totalTributos.toFixed(2)}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between items-center p-3 bg-green-50 rounded border-2 border-green-200">
            <span className="font-bold text-lg">CUSTO TOTAL</span>
            <span className="font-bold text-xl text-green-600">${costoTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Pro-rateio por Produto */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          Pro-rateio por Produto
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 font-medium">Produto</th>
                <th className="text-right p-3 font-medium">Qtd</th>
                <th className="text-right p-3 font-medium">Valor Original</th>
                <th className="text-right p-3 font-medium">Participação</th>
                <th className="text-right p-3 font-medium">Custo Rateado</th>
                <th className="text-right p-3 font-medium">Custo Unitário</th>
              </tr>
            </thead>
            <tbody>
              {rateio.map((produto, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{produto.producto || produto.name}</td>
                  <td className="p-3 text-right">{produto.cantidad || produto.quantity}</td>
                  <td className="p-3 text-right">${(produto.total || 0).toFixed(2)}</td>
                  <td className="p-3 text-right">{produto.participacao.toFixed(1)}%</td>
                  <td className="p-3 text-right font-medium text-green-600">
                    ${produto.custoRateado.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-blue-600">
                    ${produto.custoUnitario.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Opções de Exportação */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2 text-blue-600" />
          Exportar Resultados (Opcional)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onExport('excel')}
            className="flex items-center justify-center p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
          >
            <FileSpreadsheet className="w-6 h-6 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Exportar Excel</div>
              <div className="text-sm text-gray-600">Planilha com fórmulas editáveis</div>
            </div>
          </button>
          
          <button
            onClick={() => onExport('pdf')}
            className="flex items-center justify-center p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <FileText className="w-6 h-6 text-red-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Exportar PDF</div>
              <div className="text-sm text-gray-600">Relatório formatado para impressão</div>
            </div>
          </button>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          💡 A exportação é opcional. Todos os cálculos já estão disponíveis na tela acima.
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informações do Cálculo</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Todos os valores estão em Dólares Americanos (USD)</li>
          <li>• Tributos calculados conforme legislação argentina</li>
          <li>• Pro-rateio baseado na participação de cada produto no valor total</li>
          <li>• Custos fixos distribuídos proporcionalmente entre todos os produtos</li>
        </ul>
      </div>
    </div>
  );
};

export default ResultsTab;

