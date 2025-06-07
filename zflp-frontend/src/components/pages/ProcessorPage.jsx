import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Upload, Plus, Trash2 } from 'lucide-react';

const ProcessorPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('upload');
  const [products, setProducts] = useState([
    { id: Date.now(), produto: '', marca: '', quantidade: '', valor: '' }
  ]);
  const [costs, setCosts] = useState({
    fixos: { frete: '', seguro: '', outros: '' },
    variaveis: { comissao: '', marketing: '', outros: '' },
    tributos: { iva: '21', ganancias: '35' }
  });

  const updateProduct = (id, field, value) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  const addProduct = () => {
    const newProduct = { 
      id: Date.now() + Math.random(), 
      produto: '', 
      marca: '',
      quantidade: '', 
      valor: '' 
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const removeProduct = (id) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const calculateTotal = () => {
    return products.reduce((total, product) => {
      const quantidade = parseFloat(product.quantidade) || 0;
      const valor = parseFloat(product.valor) || 0;
      return total + (quantidade * valor);
    }, 0);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Implementar upload
      console.log('Upload file:', file.name);
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
                <div className="grid grid-cols-5 gap-4 font-medium">
                  <div>Produto</div>
                  <div>Marca</div>
                  <div>Quantidade</div>
                  <div>Valor Fornecedor (USD)</div>
                  <div>Ações</div>
                </div>
                
                {products.map((product) => (
                  <div key={product.id} className="grid grid-cols-5 gap-4 items-center">
                    <Input
                      placeholder="Nome do produto"
                      value={product.produto}
                      onChange={(e) => updateProduct(product.id, 'produto', e.target.value)}
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
                  <Button onClick={() => setCurrentStep(2)}>
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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados do Pro-rateio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Cálculos em desenvolvimento...</p>
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Voltar para Custos
            </Button>
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
