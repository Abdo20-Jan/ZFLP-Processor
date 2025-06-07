import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Upload, Plus, Trash2, Save, Download, AlertTriangle, Info, Search, CheckSquare, Square, BarChart3, FileText, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';

// Base de dados real dos produtos (será carregada do backend)
const REAL_DATABASE = {
  produtos: [], // Será preenchido via API
  marcas: ['LINGLONG', 'XBRI', 'ADERENZA', 'SUNSET', 'GOODRIDE', 'DURATURN', 'DURABLE']
};

// Custos fixos específicos conforme PDF
const CUSTOS_FIXOS_ESPECIFICOS = [
  { id: 'precinto', nome: 'Precinto Electronico', tipo: 'fixo', valor: '', incluir: false },
  { id: 'porto_asu', nome: 'Servicios de Porto ASU/container o carreta FOB', tipo: 'fixo', valor: '', incluir: false },
  { id: 'despachante_ar', nome: 'Despachante AR = Transito a ZFLP', tipo: 'fixo', valor: '', incluir: false },
  { id: 'despachante_py', nome: 'Despachante PY', tipo: 'fixo', valor: '', incluir: false },
  { id: 'zona_primaria', nome: 'Ingreso a Zona Primaria Aduanera', tipo: 'fixo', valor: '', incluir: false },
  { id: 'gastos_ingreso', nome: 'Gastos Operativos de Ingreso', tipo: 'fixo', valor: '', incluir: false },
  { id: 'pesada_ingreso', nome: 'Pesada de Camion Ingreso', tipo: 'fixo', valor: '', incluir: false },
  { id: 'armazenagem', nome: 'Armazenagem do Neumático', tipo: 'fixo', valor: '', incluir: false },
  { id: 'descarga_carga', nome: 'Descarga/carga del ctr', tipo: 'fixo', valor: '', incluir: false },
  { id: 'preparacion_pedido', nome: 'Preparacion del Pedido x pedido', tipo: 'fixo', valor: '', incluir: false },
  { id: 'logistica_integral', nome: 'Gastos Operativos de Logistica Integral', tipo: 'fixo', valor: '', incluir: false },
  { id: 'gastos_egreso', nome: 'Gastos Operativos de Egreso', tipo: 'fixo', valor: '', incluir: false },
  { id: 'pesada_egreso', nome: 'Pesada de Camion Egreso x Egreso', tipo: 'fixo', valor: '', incluir: false },
  { id: 'resguardo_mercaderia', nome: 'Servicio de Resguardos de Mercaderia', tipo: 'percent_cif', valor: '0.10', incluir: false },
  { id: 'resguardo_ista', nome: 'Resguardo de Derechos ISTA', tipo: 'percent_fob', valor: '0.10', incluir: false },
  { id: 'certificado_reexp', nome: 'Certificado de Reexpedicion - x depacho', tipo: 'fixo', valor: '', incluir: false },
  { id: 'transferencia_dominio', nome: 'Transferencia de Dominio - x Venda', tipo: 'fixo', valor: '', incluir: false },
  { id: 'matricula_lizf', nome: 'Uso de la Matricula de LIZF como Importador (Ingreso y Egreso)', tipo: 'percent_cif', valor: '0.12', incluir: false }
];

const ProcessorPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('upload');

  // Estado para produtos (SEM APLICAÇÃO)
  const [products, setProducts] = useState([
    {
      id: Date.now(),
      item: '',
      marca: '',
      quantidade: '',
      valorFOB: '',
      totalFOB: 0,
      pesoUnit: 0,
      m3Unit: 0,
      custoProRateado: 0,
      custoFinalUnitario: 0,
      custoFinalTotal: 0,
      margemDesejada: 0,
      precoVendaUnitario: 0,
      precoVendaTotal: 0
    }
  ]);

  // Estado para base de dados carregada
  const [databaseProducts, setDatabaseProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para custos
  const [costs, setCosts] = useState({
    // Frete e Seguro
    freteInternacional: { valor: '', tipo: 'fixo' },
    seguroInternacional: { valor: '0.5', tipo: 'percent_fob' }, // Sempre % FOB

    // Custos Fixos Específicos
    custosFixos: CUSTOS_FIXOS_ESPECIFICOS.map(c => ({ ...c })),

    // Custos Variáveis (dinâmicos)
    custosVariaveis: [],

    // Tributos Nacionalização
    tributos: {
      derechoImportacion: { percent: '10', base: 'invoice_cliente' },
      tasaEstadistica: { percent: '3', base: 'invoice_cliente' },
      ivaGeneral: { percent: '21', base: 'invoice_cliente_di_te' },
      ivaAdicional: { percent: '20', base: 'invoice_cliente_di_te' },
      impuestoGanancias: { percent: '6', base: 'invoice_cliente_di_te' },
      ingresosBrutos: { percent: '3.5', base: 'invoice_cliente_di_te' },
      impuestosInternos: { percent: '0', base: 'invoice_cliente_di_te' },
      servicioDespachante: { valor: '300', tipo: 'fixo_usd' }
    },

    // Tributos Venda Final
    tributosVendaFinal: {
      ivaVendaFinal: { percent: '21', tipo: 'por_fora' },
      ingresosBrutosVenda: { percent: '3.5', tipo: 'sobre_venda' },
      impuestosInternosVenda: { percent: '0', tipo: 'sobre_venda' }
    }
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingError, setProcessingError] = useState('');
  const [invoiceClienteData, setInvoiceClienteData] = useState([]);

  // Carregar base de dados do backend
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const response = await fetch('https://zflp-processor-production.up.railway.app/api/database' );
        if (response.ok) {
          const data = await response.json();
          setDatabaseProducts(data.products || []);
          REAL_DATABASE.produtos = data.products || [];
        }
      } catch (error) {
        console.error('Erro ao carregar base de dados:', error);
      }
    };
    loadDatabase();
  }, []);

  // Filtrar produtos para autocomplete
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = databaseProducts.filter(p => 
        p.Item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.Marca?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered.slice(0, 10)); // Limitar a 10 resultados
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, databaseProducts]);

  // Função para normalizar valores decimais (vírgula para ponto)
  const normalizeDecimal = useCallback((value) => {
    if (typeof value === 'string') {
      // Substituir vírgula por ponto para valores decimais
      return value.replace(',', '.');
    }
    return value;
  }, []);

  // --- Funções de Manipulação de Produtos ---
  const updateProductField = useCallback((id, field, value) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === id) {
          const updatedProduct = { ...p, [field]: value };
          
          // Recalcular Total FOB se quantidade ou valorFOB mudar
          if (field === 'quantidade' || field === 'valorFOB') {
            const qty = parseFloat(normalizeDecimal(updatedProduct.quantidade)) || 0;
            const fob = parseFloat(normalizeDecimal(updatedProduct.valorFOB)) || 0;
            updatedProduct.totalFOB = qty * fob;
          }
          
          // Se item mudar, buscar na base de dados
          if (field === 'item' && value.length >= 2) {
            setSearchTerm(value);
          }
          
          return updatedProduct;
        }
        return p;
      })
    );
  }, [normalizeDecimal]);

  const selectProductFromDatabase = useCallback((productId, dbProduct) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            item: dbProduct.Item || '',
            marca: dbProduct.Marca || '',
            valorFOB: String(dbProduct['FCA '] || ''),
            pesoUnit: dbProduct['Peso Unit'] || 0,
            m3Unit: dbProduct.M3 || 0,
            totalFOB: (parseFloat(normalizeDecimal(p.quantidade)) || 0) * (parseFloat(normalizeDecimal(dbProduct['FCA '])) || 0)
          };
        }
        return p;
      })
    );
    setFilteredProducts([]);
    setSearchTerm('');
  }, [normalizeDecimal]);

  const addNewProduct = useCallback(() => {
    setProducts(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        item: '',
        marca: '',
        quantidade: '',
        valorFOB: '',
        totalFOB: 0,
        pesoUnit: 0,
        m3Unit: 0,
        custoProRateado: 0,
        custoFinalUnitario: 0,
        custoFinalTotal: 0,
        margemDesejada: 0,
        precoVendaUnitario: 0,
        precoVendaTotal: 0
      }
    ]);
  }, []);

  const removeProduct = useCallback(id => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // --- Upload de Excel CORRIGIDO PARA FUNCIONAR NA NUVEM ---
  const handleFileUpload = async event => {
    const file = event.target.files[0];
    if (!file) {
      setProcessingError('');
      return;
    }
    setUploadedFile(file);
    setProcessingError('');

    // PROCESSAMENTO LOCAL EM VEZ DE BACKEND (para funcionar na nuvem)
    try {
      // Usar FileReader para processar localmente
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          
          // XLSX já importado no topo do arquivo
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            setProcessingError('Planilha vazia ou sem dados válidos.');
            return;
          }

          // Processar dados do Excel
          const header = jsonData[0].map(h => String(h).trim().toLowerCase());
          console.log('Cabeçalho encontrado:', header);

          // Encontrar índices das colunas
          const itemIndex = header.findIndex(h => h.includes('item') || h.includes('produto'));
          const marcaIndex = header.findIndex(h => h.includes('marca'));
          const quantidadeIndex = header.findIndex(h => h.includes('quantidade') || h.includes('qtd'));
          const valorIndex = header.findIndex(h => h.includes('valor') || h.includes('fob') || h.includes('preço') || h.includes('preco'));

          console.log('Índices encontrados:', { itemIndex, marcaIndex, quantidadeIndex, valorIndex });

          if (itemIndex === -1 || quantidadeIndex === -1 || valorIndex === -1) {
            setProcessingError('Colunas obrigatórias não encontradas. Necessário: Item, Quantidade, Valor FOB');
            return;
          }

          const parsedProducts = jsonData.slice(1).map((row, i) => {
            const item = String(row[itemIndex] || '').trim();
            const marca = marcaIndex > -1 ? String(row[marcaIndex] || '').trim() : '';
            const quantidadeRaw = String(row[quantidadeIndex] || '0').trim();
            const valorRaw = String(row[valorIndex] || '0').trim();

            // Normalizar valores decimais (vírgula para ponto)
            const quantidade = parseFloat(normalizeDecimal(quantidadeRaw));
            const valorFOB = parseFloat(normalizeDecimal(valorRaw));

            if (!item || isNaN(quantidade) || isNaN(valorFOB)) {
              console.warn(`Linha ${i + 2} ignorada por dados inválidos:`, row);
              return null;
            }

            return {
              id: Date.now() + i + Math.random(),
              item,
              marca,
              quantidade: String(quantidade),
              valorFOB: String(valorFOB),
              totalFOB: quantidade * valorFOB,
              pesoUnit: 0,
              m3Unit: 0,
              custoProRateado: 0,
              custoFinalUnitario: 0,
              custoFinalTotal: 0,
              margemDesejada: 0,
              precoVendaUnitario: 0,
              precoVendaTotal: 0
            };
          }).filter(p => p !== null);

          if (parsedProducts.length === 0) {
            setProcessingError('Nenhum produto válido encontrado na planilha.');
            return;
          }

          setProducts(parsedProducts);
          setProcessingError('');
          console.log('Produtos importados com sucesso:', parsedProducts);

        } catch (error) {
          console.error('Erro ao processar Excel:', error);
          setProcessingError(`Erro ao processar arquivo: ${error.message}`);
        }
      };

      reader.onerror = () => {
        setProcessingError('Erro ao ler o arquivo.');
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setProcessingError(`Erro: ${error.message}`);
    }
  };

  // --- Copy/Paste CORRIGIDO PARA VÍRGULAS DECIMAIS ---
  const handlePaste = useCallback((e, firstProductId, fieldName) => {
    if (fieldName !== 'item') return;

    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) return;

    console.log('=== COPY/PASTE DEBUG ===');
    console.log('Texto colado:', pastedText);
    console.log('Linhas processadas:', lines);

    const newPastedProducts = lines.map((line, index) => {
      // Tentar diferentes separadores
      let columns = line.split('\t'); // TAB primeiro
      if (columns.length === 1) {
        columns = line.split(/\s{2,}/); // Múltiplos espaços
      }
      if (columns.length === 1) {
        columns = line.split(','); // Vírgula
      }
      if (columns.length === 1) {
        columns = line.split(';'); // Ponto e vírgula
      }

      console.log(`Linha ${index + 1} colunas:`, columns);

      // Limpar colunas
      columns = columns.map(col => col.trim()).filter(col => col !== '');

      const item = columns[0] || '';
      let marca = '';
      let quantidade = '';
      let valorFOB = '';

      // Identificar colunas numéricas (com suporte a vírgula decimal)
      const numericalColumns = [];
      for (let i = 1; i < columns.length; i++) {
        const cleanValue = columns[i].replace(/[$\s]/g, ''); // Remove $ e espaços
        const normalizedValue = normalizeDecimal(cleanValue); // Converte vírgula para ponto
        if (!isNaN(parseFloat(normalizedValue)) && isFinite(normalizedValue)) {
          numericalColumns.push({
            index: i,
            value: normalizedValue,
            original: columns[i]
          });
        }
      }

      console.log(`Linha ${index + 1} colunas numéricas:`, numericalColumns);

      if (numericalColumns.length >= 2) {
        // Últimas duas colunas numéricas são quantidade e valor FOB
        quantidade = numericalColumns[numericalColumns.length - 2].value;
        valorFOB = numericalColumns[numericalColumns.length - 1].value;
        
        // Colunas entre item e quantidade são marca
        const textColumns = columns.slice(1, numericalColumns[numericalColumns.length - 2].index);
        marca = textColumns[0] || '';
      } else if (numericalColumns.length === 1) {
        // Apenas uma coluna numérica = valor FOB
        valorFOB = numericalColumns[0].value;
        quantidade = '1';
        
        // Colunas entre item e valor são marca
        const textColumns = columns.slice(1, numericalColumns[0].index);
        marca = textColumns[0] || '';
      } else {
        // Sem colunas numéricas, usar posições fixas
        marca = columns[1] || '';
        quantidade = normalizeDecimal(columns[2] || '1');
        valorFOB = normalizeDecimal(columns[3] || '0');
      }

      const qtyNum = parseFloat(quantidade) || 1;
      const fobNum = parseFloat(valorFOB) || 0;

      console.log(`Produto ${index + 1} final:`, {
        item,
        marca,
        quantidade: qtyNum,
        valorFOB: fobNum,
        totalFOB: qtyNum * fobNum
      });

      return {
        id: Date.now() + index + Math.random(),
        item,
        marca,
        quantidade: String(qtyNum),
        valorFOB: String(fobNum),
        totalFOB: qtyNum * fobNum,
        pesoUnit: 0,
        m3Unit: 0,
        custoProRateado: 0,
        custoFinalUnitario: 0,
        custoFinalTotal: 0,
        margemDesejada: 0,
        precoVendaUnitario: 0,
        precoVendaTotal: 0
      };
    });

    console.log('Produtos finais criados:', newPastedProducts);

    setProducts(prevProducts => {
      const firstProductIndex = prevProducts.findIndex(p => p.id === firstProductId);
      if (firstProductIndex === -1) return [...prevProducts, ...newPastedProducts];

      const productsBefore = prevProducts.slice(0, firstProductIndex);
      const productsAfter = prevProducts.slice(firstProductIndex + 1);
      
      // Se a linha atual está vazia, substitui pela primeira linha colada
      if (prevProducts[firstProductIndex] && 
          !prevProducts[firstProductIndex].item && 
          !prevProducts[firstProductIndex].quantidade && 
          !prevProducts[firstProductIndex].valorFOB) {
        
        const updatedFirstProduct = { ...newPastedProducts[0] };
        updatedFirstProduct.id = firstProductId;
        
        return [
          ...productsBefore,
          updatedFirstProduct,
          ...newPastedProducts.slice(1),
          ...productsAfter
        ];
      } else {
        return [
          ...productsBefore,
          ...newPastedProducts,
          prevProducts[firstProductIndex],
          ...productsAfter
        ];
      }
    });

  }, [normalizeDecimal]);

  // --- Funções de Cálculo ---
  const calcularSomaTotalFOB = useCallback(() => {
    return products.reduce((sum, p) => sum + (p.totalFOB || 0), 0);
  }, [products]);

  const calcularCIF = useCallback(() => {
    const totalFOB = calcularSomaTotalFOB();
    const frete = costs.freteInternacional.tipo === 'fixo' 
      ? parseFloat(normalizeDecimal(costs.freteInternacional.valor)) || 0
      : (totalFOB * (parseFloat(normalizeDecimal(costs.freteInternacional.valor)) || 0)) / 100;
    const seguro = (totalFOB * (parseFloat(normalizeDecimal(costs.seguroInternacional.valor)) || 0)) / 100;
    return totalFOB + frete + seguro;
  }, [costs, calcularSomaTotalFOB, normalizeDecimal]);

  // --- Funções de Navegação ---
  const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, 8));
  const goToPrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // --- Renderização das Etapas ---
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
              Formato: Item, Marca, Quantidade, Valor FOB (aceita vírgulas decimais)
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
                  <strong>Autocomplete:</strong> Digite 2+ caracteres no campo Item para buscar na base de dados.
                  <br />
                  <strong>Copy/Paste:</strong> Cole múltiplas linhas (Item, Marca, Quantidade, Valor FOB) no primeiro campo Item. 
                  <strong>Suporte a vírgulas decimais!</strong>
                </span>
              </p>
            </div>

            {/* Cabeçalho da Tabela (SEM APLICAÇÃO) */}
            <div className="hidden lg:grid grid-cols-[minmax(250px,3fr)_repeat(3,minmax(120px,1fr))_minmax(60px,auto)] gap-2 pb-2 border-b font-medium text-sm text-gray-600">
              <div>Item</div>
              <div>Marca</div>
              <div>Quantidade</div>
              <div>Valor FOB (USD)</div>
              <div>Ações</div>
            </div>

            {products.map((p, index) => (
              <div
                key={p.id}
                className="grid grid-cols-1 lg:grid-cols-[minmax(250px,3fr)_repeat(3,minmax(120px,1fr))_minmax(60px,auto)] gap-2 items-start py-2 border-b lg:border-none relative"
              >
                {/* Campo Item com Autocomplete */}
                <div className="relative">
                  <div className="lg:hidden text-xs font-medium text-gray-500">Item</div>
                  <Input
                    placeholder="Digite o item (autocomplete ativo)"
                    value={p.item}
                    onChange={e => updateProductField(p.id, 'item', e.target.value)}
                    onPaste={e => handlePaste(e, p.id, 'item')}
                    className="text-sm"
                  />
                  
                  {/* Dropdown de Autocomplete */}
                  {filteredProducts.length > 0 && p.item.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((dbProduct, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b"
                          onClick={() => selectProductFromDatabase(p.id, dbProduct)}
                        >
                          <div className="font-medium">{dbProduct.Item}</div>
                          <div className="text-xs text-gray-500">
                            {dbProduct.Marca} | ${dbProduct['FCA '] || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Marca</div>
                <Input
                  placeholder="Marca"
                  value={p.marca}
                  onChange={e => updateProductField(p.id, 'marca', e.target.value)}
                  className="text-sm"
                />

                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Quantidade</div>
                <Input
                  type="text"
                  placeholder="Qtd (aceita vírgulas)"
                  value={p.quantidade}
                  onChange={e => updateProductField(p.id, 'quantidade', e.target.value)}
                  className="text-sm"
                />

                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Valor FOB (USD)</div>
                <Input
                  type="text"
                  placeholder="0,00 ou 0.00"
                  value={p.valorFOB}
                  onChange={e => updateProductField(p.id, 'valorFOB', e.target.value)}
                  className="text-sm"
                />

                <div className="lg:hidden text-xs font-medium text-gray-500 mt-2 lg:mt-0">Ações</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(p.id)}
                  disabled={products.length === 1}
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
                Total FOB: ${calcularSomaTotalFOB().toFixed(2)} USD ({products.length} produtos)
              </div>
              <Button 
                onClick={goToNextStep}
                disabled={products.every(p => !p.item || !p.quantidade || !p.valorFOB)}
              >
                Continuar para Custos ZFLP <Save className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Renderização principal
  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">ZFLP Processor - Argentina</h1>
          <p className="text-sm text-gray-600">Sistema completo de pro-rateio de custos para importação (8 etapas)</p>
        </div>

        {/* Navegação das Etapas */}
        <div className="flex items-center justify-center space-x-1 sm:space-x-2 bg-white p-3 rounded-lg shadow-sm overflow-x-auto">
          {[
            { num: 1, title: 'Itens' },
            { num: 2, title: 'Custos ZFLP' },
            { num: 3, title: 'Pro-rateio' },
            { num: 4, title: 'Margens' },
            { num: 5, title: 'Invoice Cliente' },
            { num: 6, title: 'Tributos' },
            { num: 7, title: 'Venda Final' },
            { num: 8, title: 'Lucro' }
          ].map(step => (
            <div
              key={step.num}
              className={`flex items-center space-x-1 cursor-pointer p-2 rounded-md transition-all whitespace-nowrap ${
                currentStep === step.num ? 'bg-blue-600 text-white scale-105' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => {
                if (step.num <= currentStep || step.num === currentStep + 1) {
                  setCurrentStep(step.num);
                }
              }}
            >
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium border-2 ${
                currentStep === step.num ? 'border-blue-700 bg-white text-blue-600' : 
                (currentStep > step.num ? 'bg-green-500 text-white border-green-600' : 'border-gray-300')
              }`}>
                {step.num}
              </div>
              <span className="hidden sm:inline text-xs lg:text-sm">
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Conteúdo da Etapa Atual */}
        {currentStep === 1 && renderDataEntryStep()}
        {currentStep === 2 && <Card><CardHeader><CardTitle>Etapa 2: Custos ZFLP</CardTitle></CardHeader><CardContent><p>Em desenvolvimento...</p><Button onClick={goToPrevStep} variant="outline" className="mr-2">Anterior</Button><Button onClick={goToNextStep}>Próximo</Button></CardContent></Card>}
        {currentStep === 3 && <Card><CardHeader><CardTitle>Etapa 3: Relatório Pro-rateio</CardTitle></CardHeader><CardContent><p>Em desenvolvimento...</p><Button onClick={goToPrevStep} variant="outline" className="mr-2">Anterior</Button><Button onClick={goToNextStep}>Próximo</Button></CardContent></Card>}
        {currentStep === 4 && <Card><CardHeader><CardTitle>Etapa 4: Margem por Produto</CardTitle></CardHeader><CardContent><p>Em desenvolvimento...</p><Button onClick={goToPrevStep} variant="outline" className="mr-2">Anterior</Button><Button onClick={goToNextStep}>Próximo</Button></CardContent></Card>}
        {currentStep === 5 && <Card><CardHeader><CardTitle>Etapa 5: Invoice Cliente</CardTitle></CardHeader><CardContent><p>Em desenvolvimento...</p><Button onClick={goToPrevStep} variant="outline" className="mr-2">Anterior</Button><Button onClick={goToNextStep}>Próximo</Button></CardContent></Card>}
        {currentStep === 6 && <Card><CardHeader><CardTitle>Etapa 6: Tributos para Nacionalização</CardTitle></CardHeader><CardContent><p>Em desenvolvimento...</p><Button onClick={goToPrevStep} variant="outline" className="mr-2">Anterior</Button><Button onClick={goToNextStep}>Próximo</Button></CardContent></Card>}
        {currentStep === 7 && <Card><CardHeader><CardTitle>Etapa 7: Venda ao Consumidor Final</CardTitle></CardHeader><CardContent><p>Em desenvolvimento...</p><Button onClick={goToPrevStep} variant="outline" className="mr-2">Anterior</Button><Button onClick={goToNextStep}>Próximo</Button></CardContent></Card>}
        {currentStep === 8 && <Card><CardHeader><CardTitle>Etapa 8: Lucro do Importador</CardTitle></CardHeader><CardContent><p>Em desenvolvimento...</p><Button onClick={goToPrevStep} variant="outline">Anterior</Button></CardContent></Card>}

      </div>
    </div>
  );
};

export default ProcessorPage;
