


import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Upload, Plus, Trash2, Save, Download, AlertTriangle, Info } from 'lucide-react';

// Mock da base de dados - idealmente viria de um backend ou arquivo de configuração
const MOCK_DATABASE = {
  marcas: ['Marca A', 'Marca B', 'Marca C', 'Outra Marca'],
  modelos: {
    'Marca A': ['Modelo A1', 'Modelo A2'],
    'Marca B': ['Modelo B1'],
    'Marca C': ['Modelo C1', 'Modelo C2', 'Modelo C3'],
    'Outra Marca': ['Modelo Genérico 1', 'Modelo Genérico 2'],
  },
  medidas: {
    'Modelo A1': ['10x20x30 cm', '12x22x32 cm'],
    'Modelo A2': ['15x25x35 cm'],
    'Modelo B1': ['20x30x40 cm'],
    'Modelo C1': ['22x32x42 cm'],
    'Modelo C2': ['25x35x45 cm'],
    'Modelo C3': ['30x40x50 cm'],
    'Modelo Genérico 1': ['Variável'],
    'Modelo Genérico 2': ['Personalizada'],
  },
};

const ProcessorPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' ou 'manual'

  // Estado para produtos
  const [products, setProducts] = useState([
    {
      id: Date.now(),
      produto: '',
      marca: '',
      modelo: '',
      medida: '',
      quantidade: '',
      valorFOB: '', // Valor FOB unitário
      totalFOB: 0,
      custoProRateado: 0,
      custoFinalUnitario: 0,
      custoFinalTotal: 0,
    },
  ]);

  // Estado para custos (mais detalhado)
  const [costs, setCosts] = useState({
    // Custos FOB (já nos produtos)
    // Custos de Importação Diretos (Valores Fixos ou % FOB)
    freteInternacional: { valor: '', tipo: 'fixo' }, // fixo USD ou % FOB
    seguroInternacional: { valor: '0.5', tipo: 'percent_fob' }, // % FOB por padrão
    manuseioOrigem: { valor: '', tipo: 'fixo' },
    manuseioDestino: { valor: '', tipo: 'fixo' },
    taxasPortuariasAeroportuarias: { valor: '', tipo: 'fixo' },
    despachanteAduaneiroServicos: { valor: '', tipo: 'fixo' }, // Movido para Tributos
    outrosCustosDiretos: { valor: '', tipo: 'fixo' },

    // Custos Indiretos (Pro-rateio)
    // Não há mais custos indiretos aqui, tudo é direto ou tributo

    // Configurações para Invoice Cliente
    margemLucroDesejada: { valor: '20', tipo: 'percent_custo' }, // % sobre custo final pro-rateado

    // Tributos Argentinos (Calculados sobre Invoice Cliente ou Base Específica)
    // As bases serão calculadas dinamicamente
    tributos: {
      derechoImportacion: { percent: '10', base: 'invoice_cliente' }, // % sobre Invoice Cliente
      tasaEstadistica: { percent: '3', base: 'invoice_cliente' },    // % sobre Invoice Cliente
      ivaGeneral: { percent: '21', base: 'invoice_cliente_di_te' }, // % sobre (Invoice Cliente + DI + TE)
      ivaAdicional: { percent: '20', base: 'invoice_cliente_di_te' },// % sobre (Invoice Cliente + DI + TE)
      impuestoGanancias: { percent: '6', base: 'invoice_cliente_di_te' }, // % sobre (Invoice Cliente + DI + TE)
      ingresosBrutos: { percent: '3.5', base: 'invoice_cliente_di_te' }, // % sobre (Invoice Cliente + DI + TE)
      impuestosInternos: { percent: '0', base: 'invoice_cliente_di_te' }, // % sobre (Invoice Cliente + DI + TE)
      servicioDespachante: { valor: '300', tipo: 'fixo_usd' }, // Valor fixo em USD
    },
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingError, setProcessingError] = useState('');
  const [invoiceClienteData, setInvoiceClienteData] = useState([]);

  // --- Funções de Manipulação de Produtos ---
  const updateProductField = useCallback((id, field, value) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === id) {
          const updatedProduct = { ...p, [field]: value };
          // Recalcular Total FOB se quantidade ou valorFOB mudar
          if (field === 'quantidade' || field === 'valorFOB') {
            const qty = parseFloat(updatedProduct.quantidade) || 0;
            const fob = parseFloat(updatedProduct.valorFOB) || 0;
            updatedProduct.totalFOB = qty * fob;
          }
          // Se marca mudar, resetar modelo e medida
          if (field === 'marca') {
            updatedProduct.modelo = '';
            updatedProduct.medida = '';
          }
          // Se modelo mudar, resetar medida
          if (field === 'modelo') {
            updatedProduct.medida = '';
          }
          return updatedProduct;
        }
        return p;
      })
    );
  }, []);

  const addNewProduct = useCallback(() => {
    setProducts(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(), // Garante ID único
        produto: '',
        marca: '',
        modelo: '',
        medida: '',
        quantidade: '',
        valorFOB: '',
        totalFOB: 0,
        custoProRateado: 0,
        custoFinalUnitario: 0,
        custoFinalTotal: 0,
      },
    ]);
  }, []);

  const removeProduct = useCallback(id => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // --- Upload de Excel ---
  const handleFileUpload = async event => {
    const file = event.target.files[0];
    if (!file) {
      setProcessingError('');
      return;
    }
    setUploadedFile(file);
    setProcessingError('');

    // Usar FormData para enviar para o backend Railway
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://zflp-processor-production.up.railway.app/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.products && result.products.length > 0) {
          const parsedProducts = result.products.map((p, i) => ({
            id: Date.now() + i + Math.random(),
            produto: p.produto || p.name || '',
            marca: p.marca || p.brand || '',
            modelo: p.modelo || p.model || '',
            medida: p.medida || p.size || '',
            quantidade: String(p.quantidade || p.quantity || ''),
            valorFOB: String(p.valorFOB || p.valor || p.value || ''),
            totalFOB: (parseFloat(p.quantidade || p.quantity || 0) * parseFloat(p.valorFOB || p.valor || p.value || 0)),
            custoProRateado: 0,
            custoFinalUnitario: 0,
            custoFinalTotal: 0,
          }));
          setProducts(parsedProducts);
          setProcessingError('');
        } else {
          setProcessingError('Nenhum produto válido encontrado no arquivo.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setProcessingError(errorData.error || 'Erro ao processar arquivo. Verifique o formato (.xlsx, .xls).');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setProcessingError(`Erro de conexão: ${error.message}. Verifique se o backend está funcionando.`);
    }
  };

  // --- Copy/Paste ---
  const handlePaste = useCallback((e, firstProductId, fieldName) => {
    if (fieldName !== 'produto') return; // Ativar paste apenas no primeiro campo "Produto"

    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) return;

    const newPastedProducts = lines.map((line, index) => {
      const columns = line.split('\t'); // Assume separação por TAB (Excel)
      const produto = columns[0] ? columns[0].trim() : '';
      const marca = columns[1] ? columns[1].trim() : '';
      // Tentar obter modelo e medida se existirem, senão deixar em branco
      const modelo = columns[2] && columns.length > 3 ? columns[2].trim() : ''; 
      const medida = columns[3] && columns.length > 4 ? columns[3].trim() : '';
      // Quantidade e Valor FOB são os últimos ou penúltimos
      let quantidade = '';
      let valorFOB = '';

      if (columns.length === 2) { // Produto, ValorFOB (simples)
        valorFOB = columns[1] ? String(columns[1].trim().replace(',', '.')) : '';
      } else if (columns.length === 3) { // Produto, Quantidade, ValorFOB
        quantidade = columns[1] ? String(columns[1].trim().replace(',', '.')) : '';
        valorFOB = columns[2] ? String(columns[2].trim().replace(',', '.')) : '';
      } else if (columns.length === 4) { // Produto, Marca, Quantidade, ValorFOB
        quantidade = columns[2] ? String(columns[2].trim().replace(',', '.')) : '';
        valorFOB = columns[3] ? String(columns[3].trim().replace(',', '.')) : '';
      } else if (columns.length >= 5) { // Produto, Marca, Modelo, Quantidade, ValorFOB ou Produto, Marca, Modelo, Medida, Quantidade, ValorFOB
         // Se tiver 5 colunas: Produto, Marca, Modelo, Quantidade, ValorFOB
         // Se tiver 6 colunas: Produto, Marca, Modelo, Medida, Quantidade, ValorFOB
        const qtyIndex = columns.length === 5 ? 3 : 4;
        const fobIndex = columns.length === 5 ? 4 : 5;
        quantidade = columns[qtyIndex] ? String(columns[qtyIndex].trim().replace(',', '.')) : '';
        valorFOB = columns[fobIndex] ? String(columns[fobIndex].trim().replace(',', '.')) : '';
      }

      const qtyNum = parseFloat(quantidade) || 0;
      const fobNum = parseFloat(valorFOB) || 0;

      return {
        id: Date.now() + index + Math.random(),
        produto,
        marca,
        modelo,
        medida,
        quantidade: String(qtyNum),
        valorFOB: String(fobNum),
        totalFOB: qtyNum * fobNum,
        custoProRateado: 0,
        custoFinalUnitario: 0,
        custoFinalTotal: 0,
      };
    });

    setProducts(prevProducts => {
      const firstProductIndex = prevProducts.findIndex(p => p.id === firstProductId);
      if (firstProductIndex === -1) return [...prevProducts, ...newPastedProducts]; // Se não achar, adiciona no fim

      // Se a primeira linha colada deve substituir a linha atual onde o paste ocorreu
      // E as demais são adicionadas após.
      const productsBefore = prevProducts.slice(0, firstProductIndex);
      const productsAfter = prevProducts.slice(firstProductIndex + 1);
      
      // A primeira linha colada substitui a linha atual se ela estiver vazia, senão insere antes.
      const updatedFirstPastedProduct = { ...newPastedProducts[0] };
      let finalProducts;

      if (prevProducts[firstProductIndex] && 
          !prevProducts[firstProductIndex].produto && 
          !prevProducts[firstProductIndex].quantidade && 
          !prevProducts[firstProductIndex].valorFOB) {
        // Linha atual está vazia, substitui com o primeiro item colado
        updatedFirstPastedProduct.id = firstProductId; // Mantém o ID da linha original
        finalProducts = [
            ...productsBefore,
            updatedFirstPastedProduct,
            ...newPastedProducts.slice(1),
            ...productsAfter
        ];
      } else {
        // Linha atual não está vazia, insere todos os produtos colados ANTES da linha atual
         finalProducts = [
            ...productsBefore,
            ...newPastedProducts,
            prevProducts[firstProductIndex], // Mantém a linha original onde o paste ocorreu
            ...productsAfter
        ];
      }
      // Remove a linha original se ela era a única e foi substituída, e agora há mais produtos
      if (prevProducts.length === 1 && finalProducts.length > 1 && finalProducts[0].id === firstProductId && newPastedProducts.length > 0) {
        if (!prevProducts[0].produto && !prevProducts[0].quantidade && !prevProducts[0].valorFOB) {
            // Se a linha original estava vazia e foi substituída, ok.
        } else {
            // Se não estava vazia, ela foi mantida, então não precisa remover.
        }
      }
      // Se a linha original era a única e estava vazia, e foi substituída, e só há um produto colado.
      if (prevProducts.length === 1 && newPastedProducts.length === 1 && finalProducts.length === 1 && finalProducts[0].id === firstProductId) {
        // ok, foi substituída
      }

      return finalProducts.filter(p => p.id); // Garante que não há produtos sem ID
    });

  }, [setProducts]);

  // --- Funções de Cálculo Geral ---
  const calcularSomaTotalFOB = useCallback(() => {
    return products.reduce((sum, p) => sum + (p.totalFOB || 0), 0);
  }, [products]);

  // --- Funções de Navegação e Submissão ---
  const goToNextStep = () => setCurrentStep(prev => prev + 1);
  const goToPrevStep = () => setCurrentStep(prev => prev - 1);

  // Efeito para recalcular totais quando products muda
  useEffect(() => {
    // Poderia adicionar lógicas que dependem da mudança em products aqui
    // Por exemplo, se houver um resumo que precise ser atualizado.
  }, [products]);

  // --- Renderização dos Componentes de Etapa ---
  const renderDataEntryStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Etapa 1: Entrada de Dados dos Produtos
          <div className="flex space-x-1 bg-gray-100 p-0.5 rounded-lg">
            <Button
              size="sm"
              variant={activeTab === 'upload' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('upload')}
              className={`transition-all ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Upload className="w-4 h-4 mr-2" /> Upload Excel
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'manual' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('manual')}
              className={`transition-all ${activeTab === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Plus className="w-4 h-4 mr-2" /> Entrada Manual
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeTab === 'upload' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-3">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900">
              Upload de Planilha Excel (.xlsx, .xls)
            </h3>
            <p className="text-sm text-gray-600">
              A planilha deve conter as colunas: Produto, Quantidade, Valor FOB. Opcional: Marca, Modelo, Medida.
            </p>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" /> Selecionar Arquivo
            </label>
            {uploadedFile && (
              <p className="mt-2 text-xs text-green-600">
                Arquivo selecionado: {uploadedFile.name}
              </p>
            )}
            {processingError && (
              <p className="mt-2 text-xs text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 mr-1" /> {processingError}
              </p>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 flex items-start">
                    <Info size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                        <strong>Dica de Colar:</strong> Cole múltiplas linhas do Excel (Produto, Marca, Modelo, Medida, Quantidade, Valor FOB - separados por Tab) no campo 'Produto' da primeira linha desejada. As linhas subsequentes serão criadas automaticamente.
                        Formatos aceitos para colar (mínimo Produto e Valor FOB):
                        <ul className="list-disc list-inside ml-4 mt-1">
                            <li>Produto, Marca, Modelo, Medida, Quantidade, Valor FOB</li>
                            <li>Produto, Marca, Modelo, Quantidade, Valor FOB</li>
                            <li>Produto, Marca, Quantidade, Valor FOB</li>
                            <li>Produto, Quantidade, Valor FOB</li>
                            <li>Produto, Valor FOB</li>
                        </ul>
                    </span>
                </p>
            </div>
            {/* Cabeçalho da Tabela Manual */}
            <div className="hidden lg:grid grid-cols-[minmax(200px,3fr)_repeat(5,minmax(100px,1fr))_minmax(60px,auto)] gap-2 pb-2 border-b font-medium text-sm text-gray-600">
              <div>Produto</div>
              <div>Marca</div>
              <div>Modelo</div>
              <div>Medida</div>
              <div>Quantidade</div>
              <div>Valor FOB (USD)</div>
              <div>Ações</div>
            </div>

            {products.map((p, index) => (
              <div
                key={p.id}
                className="grid grid-cols-1 lg:grid-cols-[minmax(200px,3fr)_repeat(5,minmax(100px,1fr))_minmax(60px,auto)] gap-2 items-start py-2 border-b lg:border-none"
              >
                {/* Inputs para cada campo do produto */}
                <div className="lg:hidden text-xs font-medium text-gray-500">Produto</div>
                <Input
                  placeholder="Nome do Produto"
                  value={p.produto}
                  onChange={e => updateProductField(p.id, 'produto', e.target.value)}
                  onPaste={e => handlePaste(e, p.id, 'produto')}
                  className="text-sm"
                />
                
                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Marca</div>
                <select 
                    value={p.marca} 
                    onChange={e => updateProductField(p.id, 'marca', e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                    <option value="">Selecione Marca</option>
                    {MOCK_DATABASE.marcas.map(marca => <option key={marca} value={marca}>{marca}</option>)}
                </select>

                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Modelo</div>
                <select 
                    value={p.modelo} 
                    onChange={e => updateProductField(p.id, 'modelo', e.target.value)}
                    disabled={!p.marca || !MOCK_DATABASE.modelos[p.marca]}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white disabled:bg-gray-100"
                >
                    <option value="">Selecione Modelo</option>
                    {p.marca && MOCK_DATABASE.modelos[p.marca] && MOCK_DATABASE.modelos[p.marca].map(modelo => <option key={modelo} value={modelo}>{modelo}</option>)}
                </select>

                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Medida</div>
                 <select 
                    value={p.medida} 
                    onChange={e => updateProductField(p.id, 'medida', e.target.value)}
                    disabled={!p.modelo || !MOCK_DATABASE.medidas[p.modelo]}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white disabled:bg-gray-100"
                >
                    <option value="">Selecione Medida</option>
                    {p.modelo && MOCK_DATABASE.medidas[p.modelo] && MOCK_DATABASE.medidas[p.modelo].map(medida => <option key={medida} value={medida}>{medida}</option>)}
                </select>

                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Quantidade</div>
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={p.quantidade}
                  onChange={e => updateProductField(p.id, 'quantidade', e.target.value)}
                  className="text-sm"
                />
                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Valor FOB (USD)</div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={p.valorFOB}
                  onChange={e => updateProductField(p.id, 'valorFOB', e.target.value)}
                  className="text-sm"
                />
                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Ações</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(p.id)}
                  disabled={products.length === 1 && index === 0} // Não desabilitar se for o único, mas permitir limpar
                  className="text-red-500 hover:text-red-700 lg:mt-0 mt-2 w-full lg:w-auto justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button onClick={addNewProduct} variant="outline" size="sm" className="w-full mt-2">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Produto
            </Button>
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <div className="text-sm font-medium">
                Total FOB Geral: ${calcularSomaTotalFOB().toFixed(2)} USD
              </div>
              <Button 
                onClick={goToNextStep}
                disabled={products.every(p => !p.produto || !p.quantidade || !p.valorFOB)}
              >
                Continuar para Custos <Save className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // --- Funções de Cálculo de Custos ---
  const calcularCustosImportacao = useCallback(() => {
    const totalFOB = calcularSomaTotalFOB();
    
    // Custos Diretos
    const freteInt = costs.freteInternacional.tipo === 'fixo' 
      ? parseFloat(costs.freteInternacional.valor) || 0
      : (totalFOB * (parseFloat(costs.freteInternacional.valor) || 0)) / 100;
    
    const seguroInt = costs.seguroInternacional.tipo === 'percent_fob' 
      ? (totalFOB * (parseFloat(costs.seguroInternacional.valor) || 0)) / 100
      : parseFloat(costs.seguroInternacional.valor) || 0;
    
    const manuseioOrig = parseFloat(costs.manuseioOrigem.valor) || 0;
    const manuseioDestino = parseFloat(costs.manuseioDestino.valor) || 0;
    const taxasPort = parseFloat(costs.taxasPortuariasAeroportuarias.valor) || 0;
    const outrosCustos = parseFloat(costs.outrosCustosDiretos.valor) || 0;
    
    const totalCustosImportacao = freteInt + seguroInt + manuseioOrig + manuseioDestino + taxasPort + outrosCustos;
    
    return {
      freteInternacional: freteInt,
      seguroInternacional: seguroInt,
      manuseioOrigem: manuseioOrig,
      manuseioDestino: manuseioDestino,
      taxasPortuarias: taxasPort,
      outrosCustos: outrosCustos,
      total: totalCustosImportacao
    };
  }, [costs, calcularSomaTotalFOB]);

  const calcularCustoProRateado = useCallback(() => {
    const totalFOB = calcularSomaTotalFOB();
    const custosImportacao = calcularCustosImportacao();
    
    if (totalFOB === 0) return products;
    
    return products.map(p => {
      const percentualProduto = p.totalFOB / totalFOB;
      const custoProRateadoProduto = custosImportacao.total * percentualProduto;
      const custoFinalUnitario = (p.totalFOB + custoProRateadoProduto) / (parseFloat(p.quantidade) || 1);
      const custoFinalTotal = p.totalFOB + custoProRateadoProduto;
      
      return {
        ...p,
        custoProRateado: custoProRateadoProduto,
        custoFinalUnitario: custoFinalUnitario,
        custoFinalTotal: custoFinalTotal
      };
    });
  }, [products, calcularSomaTotalFOB, calcularCustosImportacao]);

  const calcularInvoiceCliente = useCallback(() => {
    const produtosProRateados = calcularCustoProRateado();
    const margemPercent = parseFloat(costs.margemLucroDesejada.valor) || 0;
    
    return produtosProRateados.map(p => {
      const margemValor = (p.custoFinalTotal * margemPercent) / 100;
      const precoVendaTotal = p.custoFinalTotal + margemValor;
      const precoVendaUnitario = precoVendaTotal / (parseFloat(p.quantidade) || 1);
      
      return {
        ...p,
        margemLucro: margemValor,
        precoVendaUnitario: precoVendaUnitario,
        precoVendaTotal: precoVendaTotal
      };
    });
  }, [calcularCustoProRateado, costs.margemLucroDesejada.valor]);

  const calcularTributosArgentinos = useCallback(() => {
    const produtosComPreco = calcularInvoiceCliente();
    const totalInvoiceCliente = produtosComPreco.reduce((sum, p) => sum + p.precoVendaTotal, 0);
    
    // Tributos sobre Invoice Cliente
    const derechoImportacion = (totalInvoiceCliente * parseFloat(costs.tributos.derechoImportacion.percent)) / 100;
    const tasaEstadistica = (totalInvoiceCliente * parseFloat(costs.tributos.tasaEstadistica.percent)) / 100;
    
    // Base para outros tributos: Invoice Cliente + DI + TE
    const baseTributosCompletos = totalInvoiceCliente + derechoImportacion + tasaEstadistica;
    
    const ivaGeneral = (baseTributosCompletos * parseFloat(costs.tributos.ivaGeneral.percent)) / 100;
    const ivaAdicional = (baseTributosCompletos * parseFloat(costs.tributos.ivaAdicional.percent)) / 100;
    const impuestoGanancias = (baseTributosCompletos * parseFloat(costs.tributos.impuestoGanancias.percent)) / 100;
    const ingresosBrutos = (baseTributosCompletos * parseFloat(costs.tributos.ingresosBrutos.percent)) / 100;
    const impuestosInternos = (baseTributosCompletos * parseFloat(costs.tributos.impuestosInternos.percent)) / 100;
    const servicioDespachante = parseFloat(costs.tributos.servicioDespachante.valor) || 0;
    
    const totalTributos = derechoImportacion + tasaEstadistica + ivaGeneral + ivaAdicional + 
                         impuestoGanancias + ingresosBrutos + impuestosInternos + servicioDespachante;
    
    return {
      totalInvoiceCliente,
      derechoImportacion,
      tasaEstadistica,
      baseTributosCompletos,
      ivaGeneral,
      ivaAdicional,
      impuestoGanancias,
      ingresosBrutos,
      impuestosInternos,
      servicioDespachante,
      totalTributos
    };
  }, [calcularInvoiceCliente, costs.tributos]);

  // --- Renderização das Etapas ---
  const renderCostsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Etapa 2: Custos de Importação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <Info className="w-4 h-4 inline mr-1" />
            Configure os custos de importação. O seguro é calculado como percentual do valor FOB total.
          </p>
        </div>

        {/* Custos Diretos de Importação */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Custos Diretos de Importação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Frete Internacional</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costs.freteInternacional.valor}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    freteInternacional: { ...prev.freteInternacional, valor: e.target.value }
                  }))}
                  className="flex-1"
                />
                <select
                  value={costs.freteInternacional.tipo}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    freteInternacional: { ...prev.freteInternacional, tipo: e.target.value }
                  }))}
                  className="w-20 p-2 border rounded-md text-sm"
                >
                  <option value="fixo">USD</option>
                  <option value="percent_fob">% FOB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Seguro Internacional (% FOB)</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.5"
                  value={costs.seguroInternacional.valor}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    seguroInternacional: { ...prev.seguroInternacional, valor: e.target.value }
                  }))}
                  className="flex-1"
                />
                <div className="w-20 p-2 border rounded-md text-sm bg-gray-100 text-center">% FOB</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Manuseio Origem (USD)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={costs.manuseioOrigem.valor}
                onChange={e => setCosts(prev => ({
                  ...prev,
                  manuseioOrigem: { ...prev.manuseioOrigem, valor: e.target.value }
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Manuseio Destino (USD)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={costs.manuseioDestino.valor}
                onChange={e => setCosts(prev => ({
                  ...prev,
                  manuseioDestino: { ...prev.manuseioDestino, valor: e.target.value }
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Taxas Portuárias/Aeroportuárias (USD)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={costs.taxasPortuariasAeroportuarias.valor}
                onChange={e => setCosts(prev => ({
                  ...prev,
                  taxasPortuariasAeroportuarias: { ...prev.taxasPortuariasAeroportuarias, valor: e.target.value }
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Outros Custos Diretos (USD)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={costs.outrosCustosDiretos.valor}
                onChange={e => setCosts(prev => ({
                  ...prev,
                  outrosCustosDiretos: { ...prev.outrosCustosDiretos, valor: e.target.value }
                }))}
              />
            </div>
          </div>
        </div>

        {/* Resumo dos Custos */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Resumo dos Custos de Importação</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Total FOB: ${calcularSomaTotalFOB().toFixed(2)}</div>
            <div>Total Custos Importação: ${calcularCustosImportacao().total.toFixed(2)}</div>
          </div>
        </div>

        {/* Configuração de Margem para Invoice Cliente */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Configuração para Invoice Cliente</h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-1">Margem de Lucro Desejada (%)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="20.00"
              value={costs.margemLucroDesejada.valor}
              onChange={e => setCosts(prev => ({
                ...prev,
                margemLucroDesejada: { ...prev.margemLucroDesejada, valor: e.target.value }
              }))}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={goToPrevStep}>
            Anterior
          </Button>
          <Button onClick={goToNextStep}>
            Continuar para Invoice & Tributos
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderInvoiceAndTaxesStep = () => {
    const produtosComPreco = calcularInvoiceCliente();
    const tributos = calcularTributosArgentinos();

    return (
      <Card>
        <CardHeader>
          <CardTitle>Etapa 3: Invoice Cliente & Tributos Argentinos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview da Invoice Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Simulação Invoice Cliente</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 p-2 text-left">Produto</th>
                    <th className="border border-gray-300 p-2 text-right">Qtd</th>
                    <th className="border border-gray-300 p-2 text-right">Custo Unit.</th>
                    <th className="border border-gray-300 p-2 text-right">Margem</th>
                    <th className="border border-gray-300 p-2 text-right">Preço Unit.</th>
                    <th className="border border-gray-300 p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosComPreco.map(p => (
                    <tr key={p.id}>
                      <td className="border border-gray-300 p-2">{p.produto}</td>
                      <td className="border border-gray-300 p-2 text-right">{p.quantidade}</td>
                      <td className="border border-gray-300 p-2 text-right">${p.custoFinalUnitario.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">${(p.margemLucro / parseFloat(p.quantidade)).toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">${p.precoVendaUnitario.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">${p.precoVendaTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td colSpan="5" className="border border-gray-300 p-2 text-right">Total Invoice Cliente:</td>
                    <td className="border border-gray-300 p-2 text-right">${tributos.totalInvoiceCliente.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Configuração de Tributos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Tributos Argentinos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Derecho de Importación (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.tributos.derechoImportacion.percent}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    tributos: { ...prev.tributos, derechoImportacion: { ...prev.tributos.derechoImportacion, percent: e.target.value } }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Base: Valor Invoice Cliente</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tasa Estadística (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.tributos.tasaEstadistica.percent}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    tributos: { ...prev.tributos, tasaEstadistica: { ...prev.tributos.tasaEstadistica, percent: e.target.value } }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Base: Valor Invoice Cliente</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IVA Geral (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.tributos.ivaGeneral.percent}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    tributos: { ...prev.tributos, ivaGeneral: { ...prev.tributos.ivaGeneral, percent: e.target.value } }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Base: Invoice + DI + TE</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IVA Adicional (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.tributos.ivaAdicional.percent}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    tributos: { ...prev.tributos, ivaAdicional: { ...prev.tributos.ivaAdicional, percent: e.target.value } }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Base: Invoice + DI + TE</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Impuesto a la Ganancia (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.tributos.impuestoGanancias.percent}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    tributos: { ...prev.tributos, impuestoGanancias: { ...prev.tributos.impuestoGanancias, percent: e.target.value } }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Base: Invoice + DI + TE</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ingresos Brutos Provinciales (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.tributos.ingresosBrutos.percent}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    tributos: { ...prev.tributos, ingresosBrutos: { ...prev.tributos.ingresosBrutos, percent: e.target.value } }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Base: Invoice + DI + TE</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Impuestos Internos (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.tributos.impuestosInternos.percent}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    tributos: { ...prev.tributos, impuestosInternos: { ...prev.tributos.impuestosInternos, percent: e.target.value } }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Base: Invoice + DI + TE</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Serviço Despachante (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costs.tributos.servicioDespachante.valor}
                  onChange={e => setCosts(prev => ({
                    ...prev,
                    tributos: { ...prev.tributos, servicioDespachante: { ...prev.tributos.servicioDespachante, valor: e.target.value } }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Valor fixo em USD</p>
              </div>
            </div>
          </div>

          {/* Resumo dos Tributos */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Resumo dos Tributos</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Derecho de Importación: ${tributos.derechoImportacion.toFixed(2)}</div>
              <div>Tasa Estadística: ${tributos.tasaEstadistica.toFixed(2)}</div>
              <div>IVA Geral: ${tributos.ivaGeneral.toFixed(2)}</div>
              <div>IVA Adicional: ${tributos.ivaAdicional.toFixed(2)}</div>
              <div>Imp. Ganancias: ${tributos.impuestoGanancias.toFixed(2)}</div>
              <div>Ingresos Brutos: ${tributos.ingresosBrutos.toFixed(2)}</div>
              <div>Imp. Internos: ${tributos.impuestosInternos.toFixed(2)}</div>
              <div>Serv. Despachante: ${tributos.servicioDespachante.toFixed(2)}</div>
            </div>
            <div className="border-t mt-2 pt-2 font-semibold">
              Total Tributos: ${tributos.totalTributos.toFixed(2)}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={goToPrevStep}>
              Anterior
            </Button>
            <Button onClick={goToNextStep}>
              Ver Resultados Finais
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFinalResultsStep = () => {
    const produtosProRateados = calcularCustoProRateado();
    const produtosComPreco = calcularInvoiceCliente();
    const custosImportacao = calcularCustosImportacao();
    const tributos = calcularTributosArgentinos();

    const exportToExcel = () => {
      // Implementar exportação para Excel
      alert('Funcionalidade de exportação em desenvolvimento');
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Etapa 4: Resultados Finais e Relatório Completo
            <Button onClick={exportToExcel} className="flex items-center">
              <Download className="w-4 h-4 mr-2" /> Exportar Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Total FOB</h4>
              <p className="text-2xl font-bold text-blue-900">${calcularSomaTotalFOB().toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Total Invoice Cliente</h4>
              <p className="text-2xl font-bold text-green-900">${tributos.totalInvoiceCliente.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800">Total Tributos</h4>
              <p className="text-2xl font-bold text-red-900">${tributos.totalTributos.toFixed(2)}</p>
            </div>
          </div>

          {/* Tabela Detalhada de Produtos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Detalhamento por Produto</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 p-2 text-left">Produto</th>
                    <th className="border border-gray-300 p-2 text-left">Marca</th>
                    <th className="border border-gray-300 p-2 text-left">Modelo</th>
                    <th className="border border-gray-300 p-2 text-right">Qtd</th>
                    <th className="border border-gray-300 p-2 text-right">FOB Unit.</th>
                    <th className="border border-gray-300 p-2 text-right">FOB Total</th>
                    <th className="border border-gray-300 p-2 text-right">Pro-rateio</th>
                    <th className="border border-gray-300 p-2 text-right">Custo Final Unit.</th>
                    <th className="border border-gray-300 p-2 text-right">Preço Venda Unit.</th>
                    <th className="border border-gray-300 p-2 text-right">Preço Venda Total</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosComPreco.map(p => (
                    <tr key={p.id}>
                      <td className="border border-gray-300 p-2">{p.produto}</td>
                      <td className="border border-gray-300 p-2">{p.marca}</td>
                      <td className="border border-gray-300 p-2">{p.modelo}</td>
                      <td className="border border-gray-300 p-2 text-right">{p.quantidade}</td>
                      <td className="border border-gray-300 p-2 text-right">${parseFloat(p.valorFOB).toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">${p.totalFOB.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">${p.custoProRateado.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">${p.custoFinalUnitario.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">${p.precoVendaUnitario.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">${p.precoVendaTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalhamento de Custos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Custos de Importação</h4>
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Frete Internacional:</span>
                  <span>${custosImportacao.freteInternacional.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seguro Internacional:</span>
                  <span>${custosImportacao.seguroInternacional.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manuseio Origem:</span>
                  <span>${custosImportacao.manuseioOrigem.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manuseio Destino:</span>
                  <span>${custosImportacao.manuseioDestino.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxas Portuárias:</span>
                  <span>${custosImportacao.taxasPortuarias.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outros Custos:</span>
                  <span>${custosImportacao.outrosCustos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>${custosImportacao.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Tributos Argentinos</h4>
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Derecho de Importación:</span>
                  <span>${tributos.derechoImportacion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasa Estadística:</span>
                  <span>${tributos.tasaEstadistica.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA Geral:</span>
                  <span>${tributos.ivaGeneral.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA Adicional:</span>
                  <span>${tributos.ivaAdicional.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Imp. Ganancias:</span>
                  <span>${tributos.impuestoGanancias.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ingresos Brutos:</span>
                  <span>${tributos.ingresosBrutos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Imp. Internos:</span>
                  <span>${tributos.impuestosInternos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Serv. Despachante:</span>
                  <span>${tributos.servicioDespachante.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>${tributos.totalTributos.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={goToPrevStep}>
              Anterior
            </Button>
            <Button onClick={() => setCurrentStep(1)} variant="outline">
              Nova Simulação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderização principal
  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">ZFLP Processor - Argentina</h1>
          <p className="text-sm text-gray-600">Sistema de pro-rateio de custos para importação (Valores em USD)</p>
        </div>

        {/* Navegação das Etapas */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8 bg-white p-3 rounded-lg shadow-sm">
          {[1, 2, 3, 4].map(stepNum => (
            <div
              key={stepNum}
              className={`flex items-center space-x-2 cursor-pointer p-2 rounded-md transition-all ${currentStep === stepNum ? 'bg-blue-600 text-white scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => {
                // Permite navegação para etapas anteriores ou para a próxima se a atual estiver válida
                if (stepNum < currentStep || 
                    (stepNum === currentStep + 1 && !products.every(p => !p.produto || !p.quantidade || !p.valorFOB)) ||
                    (stepNum > 1 && products.every(p => !p.produto || !p.quantidade || !p.valorFOB) && currentStep === 1) // Bloqueia se etapa 1 vazia
                   ) {
                     if (stepNum > 1 && products.every(p => !p.produto || !p.quantidade || !p.valorFOB) && currentStep === 1) {
                        setProcessingError("Adicione produtos antes de prosseguir para custos.");
                        setActiveTab('manual');
                        return;
                     }
                     setCurrentStep(stepNum);
                     setProcessingError('');
                   }
              }}
            >
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium border-2 ${currentStep === stepNum ? 'border-blue-700 bg-white text-blue-600' : (currentStep > stepNum ? 'bg-green-500 text-white border-green-600' : 'border-gray-300')}`}>
                {stepNum}
              </div>
              <span className="hidden sm:inline text-xs lg:text-sm">
                {stepNum === 1 && 'Produtos'}
                {stepNum === 2 && 'Custos Importação'}
                {stepNum === 3 && 'Invoice Cliente & Tributos'}
                {stepNum === 4 && 'Resultados Finais'}
              </span>
            </div>
          ))}
        </div>

        {/* Conteúdo da Etapa Atual */}
        {currentStep === 1 && renderDataEntryStep()}
        {currentStep === 2 && renderCostsStep()}
        {currentStep === 3 && renderInvoiceAndTaxesStep()}
        {currentStep === 4 && renderFinalResultsStep()}

      </div>
    </div>
  );
};

export default ProcessorPage;


