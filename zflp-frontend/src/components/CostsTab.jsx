import React, { useState } from 'react';
import { Plus, Trash2, Calculator, DollarSign, Percent } from 'lucide-react';

const CostsTab = ({ productData, onCalculationComplete }) => {
  const [costosFijos, setCostosFijos] = useState([
    { id: 1, descripcion: '', valor: '', tipo: 'valor', activo: true }
  ]);
  
  const [costosVariables, setCostosVariables] = useState([
    { id: 1, descripcion: '', valor: '', tipo: 'porcentaje', activo: true }
  ]);
  
  const [tributos, setTributos] = useState([
    { id: 1, descripcion: 'IVA', valor: '21', tipo: 'porcentaje', activo: true },
    { id: 2, descripcion: 'Ganancias', valor: '', tipo: 'porcentaje', activo: false },
    { id: 3, descripcion: 'Ingresos Brutos', valor: '', tipo: 'porcentaje', activo: false }
  ]);

  // Sugestões para autocomplete
  const sugestoesCustosFijos = [
    'Aluguel', 'Energia Elétrica', 'Internet', 'Telefone', 'Seguro',
    'Salários', 'Contador', 'Licenças', 'Manutenção', 'Depreciação'
  ];

  const sugestoesCostosVariables = [
    'Frete', 'Comissões', 'Embalagem', 'Marketing', 'Combustível',
    'Manutenção Veículos', 'Despesas Viagem', 'Taxas Bancárias'
  ];

  const sugestoesTributos = [
    'IVA', 'Ganancias', 'Ingresos Brutos', 'Derechos de Importación',
    'Tasa de Estadística', 'AFIP', 'Impuesto PAIS', 'Percepción IIBB'
  ];

  // Funções para adicionar/remover itens
  const addItem = (type) => {
    const newId = Date.now();
    const newItem = { id: newId, descripcion: '', valor: '', tipo: 'valor', activo: true };
    
    switch (type) {
      case 'fijos':
        setCostosFijos([...costosFijos, newItem]);
        break;
      case 'variables':
        setCostosVariables([...costosVariables, { ...newItem, tipo: 'porcentaje' }]);
        break;
      case 'tributos':
        setTributos([...tributos, { ...newItem, tipo: 'porcentaje' }]);
        break;
    }
  };

  const removeItem = (type, id) => {
    switch (type) {
      case 'fijos':
        setCostosFijos(costosFijos.filter(item => item.id !== id));
        break;
      case 'variables':
        setCostosVariables(costosVariables.filter(item => item.id !== id));
        break;
      case 'tributos':
        setTributos(tributos.filter(item => item.id !== id));
        break;
    }
  };

  const updateItem = (type, id, field, value) => {
    const updateArray = (array) => 
      array.map(item => item.id === id ? { ...item, [field]: value } : item);

    switch (type) {
      case 'fijos':
        setCostosFijos(updateArray(costosFijos));
        break;
      case 'variables':
        setCostosVariables(updateArray(costosVariables));
        break;
      case 'tributos':
        setTributos(updateArray(tributos));
        break;
    }
  };

  // Calcular totais
  const calcularTotais = () => {
    const totalProdutos = productData.reduce((sum, product) => sum + (product.total || 0), 0);
    
    // Custos fixos (valor absoluto)
    const totalCustosFijos = costosFijos
      .filter(item => item.activo && item.valor)
      .reduce((sum, item) => sum + parseFloat(item.valor || 0), 0);

    // Custos variáveis (porcentagem sobre produtos)
    const totalCostosVariables = costosVariables
      .filter(item => item.activo && item.valor)
      .reduce((sum, item) => {
        const valor = parseFloat(item.valor || 0);
        return sum + (item.tipo === 'porcentaje' ? (totalProdutos * valor / 100) : valor);
      }, 0);

    // Tributos (porcentagem sobre produtos + custos)
    const baseCalculo = totalProdutos + totalCostosVariables;
    const totalTributos = tributos
      .filter(item => item.activo && item.valor)
      .reduce((sum, item) => {
        const valor = parseFloat(item.valor || 0);
        return sum + (item.tipo === 'porcentaje' ? (baseCalculo * valor / 100) : valor);
      }, 0);

    const costoTotal = totalProdutos + totalCustosFijos + totalCostosVariables + totalTributos;

    return {
      totalProdutos,
      totalCustosFijos,
      totalCostosVariables,
      totalTributos,
      costoTotal,
      rateio: calcularRateio(costoTotal, totalProdutos)
    };
  };

  const calcularRateio = (costoTotal, totalProdutos) => {
    if (totalProdutos === 0) return [];
    
    return productData.map(product => {
      const participacao = (product.total || 0) / totalProdutos;
      const custoRateado = costoTotal * participacao;
      const custoUnitario = product.cantidad ? custoRateado / product.cantidad : 0;
      
      return {
        ...product,
        participacao: participacao * 100,
        custoRateado,
        custoUnitario
      };
    });
  };

  const finalizarCalculos = () => {
    const resultados = calcularTotais();
    onCalculationComplete(resultados);
  };

  // Componente para renderizar seção de custos
  const CostSection = ({ title, items, setItems, type, suggestions, icon: Icon }) => (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Icon className="w-5 h-5 mr-2 text-blue-600" />
          {title}
        </h3>
        <button
          onClick={() => addItem(type)}
          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={item.activo}
                onChange={(e) => updateItem(type, item.id, 'activo', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div className="col-span-5">
              <input
                type="text"
                placeholder="Descrição"
                value={item.descripcion}
                onChange={(e) => updateItem(type, item.id, 'descripcion', e.target.value)}
                list={`suggestions-${type}`}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <datalist id={`suggestions-${type}`}>
                {suggestions.map((suggestion, index) => (
                  <option key={index} value={suggestion} />
                ))}
              </datalist>
            </div>
            <div className="col-span-3">
              <input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={item.valor}
                onChange={(e) => updateItem(type, item.id, 'valor', e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <select
                value={item.tipo}
                onChange={(e) => updateItem(type, item.id, 'tipo', e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="valor">USD</option>
                <option value="porcentaje">%</option>
              </select>
            </div>
            <div className="col-span-1">
              <button
                onClick={() => removeItem(type, item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const totais = calcularTotais();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Custos</h2>
        <p className="text-gray-600">Configure os custos fixos, variáveis e tributos para cálculo do pro-rateio</p>
      </div>

      {/* Resumo dos produtos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Resumo dos Produtos</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Total de produtos:</span> {productData.length}
          </div>
          <div>
            <span className="text-blue-700">Valor total:</span> ${totais.totalProdutos.toFixed(2)} USD
          </div>
        </div>
      </div>

      {/* Seções de custos */}
      <CostSection
        title="Custos Fixos"
        items={costosFijos}
        setItems={setCostosFijos}
        type="fijos"
        suggestions={sugestoesCustosFijos}
        icon={DollarSign}
      />

      <CostSection
        title="Custos Variáveis"
        items={costosVariables}
        setItems={setCostosVariables}
        type="variables"
        suggestions={sugestoesCostosVariables}
        icon={Percent}
      />

      <CostSection
        title="Tributos Argentinos"
        items={tributos}
        setItems={setTributos}
        type="tributos"
        suggestions={sugestoesTributos}
        icon={Calculator}
      />

      {/* Resumo de cálculos */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo de Cálculos</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Produtos:</span>
              <span className="font-medium">${totais.totalProdutos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Custos Fixos:</span>
              <span className="font-medium">${totais.totalCustosFijos.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Custos Variáveis:</span>
              <span className="font-medium">${totais.totalCostosVariables.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tributos:</span>
              <span className="font-medium">${totais.totalTributos.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="border-t mt-4 pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>CUSTO TOTAL:</span>
            <span className="text-green-600">${totais.costoTotal.toFixed(2)} USD</span>
          </div>
        </div>
      </div>

      {/* Botão para finalizar */}
      <div className="text-center">
        <button
          onClick={finalizarCalculos}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calcular Pro-rateio Final
        </button>
      </div>
    </div>
  );
};

export default CostsTab;

