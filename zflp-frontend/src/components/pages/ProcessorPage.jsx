import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Upload, Plus, Trash2 } from 'lucide-react';

const ProcessorPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('upload');
  const [products, setProducts] = useState([
    { id: Date.now(), produto: '', marca: '', quantidade: '', valor: '', total: 0 }
  ]);
  const [costs, setCosts] = useState({
    fixos: { frete: '', seguro: '', outros: '' },
    variaveis: { comissao: '', marketing: '', outros: '' },
    tributos: { iva: '21', ganancias: '35' }
  });
  const [uploadedFile, setUploadedFile] = useState(null);

  const updateProduct = useCallback((id, field, value) => {
    setProducts(prev => prev.map(product => {
      if (product.id === id) {
        const updated = { ...product, [field]: value };
        // Calcular total automaticamente
        if (field === 'quantidade' || field === 'valor') {
          const quantidade = parseFloat(updated.quantidade) || 0;
          const valor = parseFloat(updated.valor) || 0;
          updated.total = quantidade * valor;
        }
        return updated;
      }
      return product;
    }));
  }, []);

  const addProduct = useCallback(() => {
    const newProduct = { 
      id: Date.now() + Math.random(), 
      produto: '', 
      marca: '',
      quantidade: '', 
      valor: '',
      total: 0
    };
    setProducts(prev => [...prev, newProduct]);
  }, []);

  const removeProduct = useCallback((id) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  }, []);

  const calculateTotal = useCallback(() => {
    return products.reduce((total, product) => {
      return total + (product.total || 0);
    }, 0);
  }, [products]);

  // Função para processar paste de múltiplas linhas
  const handlePaste = (e, id, field) => {
    if (field !== 'produto') return; // Só funciona no campo produto
    
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length > 1) {
      // Múltiplas linhas - criar produtos automaticamente
      const currentIndex = products.findIndex(item => item.id === id);
      const newData = [...products];
      
      lines.forEach((line, index) => {
        const columns = line.split('\t'); // Separado por tab (Excel)
        const targetIndex = currentIndex + index;
        
        if (targetIndex < newData.length) {
          // Atualizar linha existente
          if (columns[0]) newData[targetIndex].produto = columns[0].trim();
          if (columns[1]) newData[targetIndex].marca = columns[1].trim();
          if (columns[2]) newData[targetIndex].quantidade = columns[2].trim();
          if (columns[3]) newData[targetIndex].valor = columns[3].trim();
          
          // Calcular total
          const quantidade = parseFloat(newData[targetIndex].quantidade) || 0;
          const valor = parseFloat(newData[targetIndex].valor) || 0;
          newData[targetIndex].total = quantidade * valor;
        } else {
          // Criar nova linha
          const newId = Date.now() + Math.random();
          newData.push({
            id: newId,
            produto: columns[0] ? columns[0].trim() : '',
            marca: columns[1] ? columns[1].trim() : '',
            quantidade: columns[2] ? columns[2].trim() : '',
            valor: columns[3] ? columns[3].trim() : '',
            total: 0
          });
          
          // Calcular total da nova linha
          const quantidade = parseFloat(columns[2]) || 0;
          const valor = parseFloat(columns[3]) || 0;
          newData[newData.length - 1].total = quantidade * valor;
        }
      });
      
      setProducts(newData);
    } else {
      // Uma linha - comportamento normal
      updateProduct(id, field, pastedText);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://zflp-processor-production.up.railway.app/api/upload', {
        method: 'POST',
        body: formData
      } );

      if (response.ok) {
        const result = await response.json();
        if (result.products && result.products.length > 0) {
          setProducts(result.products.map(p => ({
            id: Date.now() + Math.random(),
            produto: p.produto || p.name || '',
            marca: p.marca || p.brand || '',
            quantidade: p.quantidade || p.quantity || '',
            valor: p.valor || p.value || '',
            total: (parseFloat(p.quantidade || p.quantity || 0) * parseFloat(p.valor || p.value || 0))
          })));
          setCurrentStep(2); // Avançar para custos
        }
      } else {
        alert('Erro ao processar arquivo. Verifique o formato.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão com o servidor');
    }
  };

  const renderDataEntry = () => {
    return (
      <div className="space-y-6">
        {/* Abas */}
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upload')}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Excel</span>
          </Button>
          <Button
            variant={activeTab === 'manual' ? 'default' : 'outline'}
            onClick={() => setActiveTab('manual')}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Entrada Manual</span>
          </Button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'upload' && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <Upload className="h-16 w-16 mx-auto text-gray-400" />
                <h3 className="text-lg font-medium">Upload de Planilha Excel</h3>
                <p className="text-gray-600">Selecione um arquivo .xlsx ou .xls com seus produtos</p>
                <div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span>Selecionar Arquivo</span>
                    </Button>
                  </label>
                </div>
                {uploadedFile && (
                  <p className="text-sm text-green-600">
                    Arquivo selecionado: {uploadedFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle>Entrada Manual de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Instruções para copy/paste */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Dica:</strong> Você pode copiar múltiplas linhas do Excel e colar no campo "Produto". 
                    Formato: Produto → Marca → Quantidade → Valor (separados por Tab)
                  </p>
                </div>

                <div className="grid grid-cols-6 gap-4 font-medium">
                  <div>Produto</div>
                  <div>Marca</div>
                  <div>Quantidade</div>
                  <div>Valor Fornecedor (USD)</div>
                  <div>Total (USD)</div>
                  <div>Ações</div>
                </div>
                
                {products.map((product) => (
                  <div key={product.id} className="grid grid-cols-6 gap-4 items-center">
                    <Input
                      placeholder="Nome do produto"
                      value={product.produto}
                      onChange={(e) => updateProduct(product.id, 'produto', e.target.value)}
                      onPaste={(e) => handlePaste(e, product.id, 'produto')}
                    />
                    <Input
                      placeholder="Marca"
                      value={product.marca}
                      onChange={(e) => updateProduct(product.id, 'marca', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={product.quantidade}
                      onChange={(e) => updateProduct(product.id, 'quantidade', e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={product.valor}
                      onChange={(e) => updateProduct(product.id, 'valor', e.target.value)}
                    />
                    <div className="p-2 bg-gray-50 rounded-md font-medium">
                      ${(product.total || 0).toFixed(2)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProduct(product.id)}
                      disabled={products.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button onClick={addProduct} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    Total de produtos: {products.filter(p => p.produto).length} | 
                    Valor total: ${calculateTotal().toFixed(2)} USD
                  </div>
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={products.filter(p => p.produto && p.quantidade && p.valor).length === 0}
                  >
                    Continuar para Custos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderCosts = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Custos Fixos */}
            <div>
              <h3 className="text-lg font-medium mb-3">Custos Fixos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Frete (USD)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costs.fixos.frete}
                    onChange={(e) => setCosts(prev => ({
                      ...prev,
                      fixos: { ...prev.fixos, frete: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Seguro (USD)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costs.fixos.seguro}
                    onChange={(e) => setCosts(prev => ({
                      ...prev,
                      fixos: { ...prev.fixos, seguro: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Outros (USD)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costs.fixos.outros}
                    onChange={(e) => setCosts(prev => ({
                      ...prev,
                      fixos: { ...prev.fixos, outros: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Custos Variáveis */}
            <div>
              <h3 className="text-lg font-medium mb-3">Custos Variáveis</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Comissão (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costs.variaveis.comissao}
                    onChange={(e) => setCosts(prev => ({
                      ...prev,
                      variaveis: { ...prev.variaveis, comissao: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Marketing (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costs.variaveis.marketing}
                    onChange={(e) => setCosts(prev => ({
                      ...prev,
                      variaveis: { ...prev.variaveis, marketing: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Outros (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costs.variaveis.outros}
                    onChange={(e) => setCosts(prev => ({
                      ...prev,
                      variaveis: { ...prev.variaveis, outros: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Tributos Argentinos */}
            <div>
              <h3 className="text-lg font-medium mb-3">Tributos Argentinos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">IVA (%)</label>
                  <Input
                    type="number"
                    value={costs.tributos.iva}
                    onChange={(e) => setCosts(prev => ({
                      ...prev,
                      tributos: { ...prev.tributos, iva: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ganancias (%)</label>
                  <Input
                    type="number"
                    value={costs.tributos.ganancias}
                    onChange={(e) => setCosts(prev => ({
                      ...prev,
                      tributos: { ...prev.tributos, ganancias: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Anterior
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                Ver Resultados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => {
    const totalProducts = calculateTotal();
    const frete = parseFloat(costs.fixos.frete) || 0;
    const seguro = parseFloat(costs.fixos.seguro) || 0;
    const outros = parseFloat(costs.fixos.outros) || 0;
    const totalFixos = frete + seguro + outros;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados do Pro-rateio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Resumo dos Produtos</h4>
                <div className="space-y-1 text-sm">
                  <div>Total de produtos: {products.filter(p => p.produto).length}</div>
                  <div>Valor total: ${totalProducts.toFixed(2)} USD</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Custos Fixos</h4>
                <div className="space-y-1 text-sm">
                  <div>Frete: ${frete.toFixed(2)} USD</div>
                  <div>Seguro: ${seguro.toFixed(2)} USD</div>
                  <div>Outros: ${outros.toFixed(2)} USD</div>
                  <div className="font-medium">Total: ${totalFixos.toFixed(2)} USD</div>
                </div>
              </div>
            </div>

            {/* Tabela de produtos com pro-rateio */}
            <div>
              <h4 className="font-medium mb-3">Pro-rateio por Produto</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Produto</th>
                      <th className="border border-gray-300 p-2 text-left">Marca</th>
                      <th className="border border-gray-300 p-2 text-right">Qtd</th>
                      <th className="border border-gray-300 p-2 text-right">Valor Unit.</th>
                      <th className="border border-gray-300 p-2 text-right">Total</th>
                      <th className="border border-gray-300 p-2 text-right">Pro-rateio</th>
                      <th className="border border-gray-300 p-2 text-right">Custo Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.produto).map((product) => {
                      const productTotal = product.total || 0;
                      const percentage = totalProducts > 0 ? productTotal / totalProducts : 0;
                      const prorateio = totalFixos * percentage;
                      const custoFinal = productTotal + prorateio;
                      
                      return (
                        <tr key={product.id}>
                          <td className="border border-gray-300 p-2">{product.produto}</td>
                          <td className="border border-gray-300 p-2">{product.marca}</td>
                          <td className="border border-gray-300 p-2 text-right">{product.quantidade}</td>
                          <td className="border border-gray-300 p-2 text-right">${parseFloat(product.valor || 0).toFixed(2)}</td>
                          <td className="border border-gray-300 p-2 text-right">${productTotal.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2 text-right">${prorateio.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2 text-right font-medium">${custoFinal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Voltar para Custos
              </Button>
              <Button>
                Exportar Resultados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ZFLP Processor - Argentina
            </h1>
            <p className="text-gray-600">
              Sistema de pro-rateio de custos para importação - Valores em USD
            </p>
          </div>

          {/* Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span>Entrada de Dados</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span>Custos</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span>Resultados</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              {currentStep === 1 && renderDataEntry()}
              {currentStep === 2 && renderCosts()}
              {currentStep === 3 && renderResults()}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center mt-8 space-x-6 text-sm text-gray-500">
            <span>🇦🇷 Argentina</span>
            <span>💰 USD Exclusivo</span>
            <span>📊 Pro-rateio Automático</span>
            <span>📄 Exportação Opcional</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessorPage;
