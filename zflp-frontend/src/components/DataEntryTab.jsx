import React, { useState } from 'react';
import { Upload, Plus, Trash2, Save } from 'lucide-react';

const DataEntryTab = ({ onDataSubmit }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [manualData, setManualData] = useState([
    { id: 1, producto: '', marca: '', cantidad: '', valorFornecedor: '', total: 0 }
  ]);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Adicionar nova linha para entrada manual
  const addNewRow = () => {
    const newId = Math.max(...manualData.map(item => item.id)) + 1;
    setManualData([...manualData, {
      id: newId,
      producto: '',
      marca: '',
      cantidad: '',
      valorFornecedor: '',
      total: 0
    }]);
  };

  // Remover linha
  const removeRow = (id) => {
    if (manualData.length > 1) {
      setManualData(manualData.filter(item => item.id !== id));
    }
  };

  // Atualizar dados da linha
  const updateRow = (id, field, value) => {
    setManualData(manualData.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Calcular total automaticamente
        if (field === 'cantidad' || field === 'valorFornecedor') {
          const cantidad = parseFloat(updated.cantidad) || 0;
          const valor = parseFloat(updated.valorFornecedor) || 0;
          updated.total = cantidad * valor;
        }
        return updated;
      }
      return item;
    }));
  };

  // Função para processar paste de múltiplas linhas
  const handlePaste = (e, id, field) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length > 1) {
      // Múltiplas linhas - criar produtos automaticamente
      const currentIndex = manualData.findIndex(item => item.id === id);
      const newData = [...manualData];
      
      lines.forEach((line, index) => {
        const columns = line.split('\t'); // Separado por tab (Excel)
        const targetIndex = currentIndex + index;
        
        if (targetIndex < newData.length) {
          // Atualizar linha existente
          if (columns[0]) newData[targetIndex].producto = columns[0].trim();
          if (columns[1]) newData[targetIndex].marca = columns[1].trim();
          if (columns[2]) newData[targetIndex].cantidad = columns[2].trim();
          if (columns[3]) newData[targetIndex].valorFornecedor = columns[3].trim();
          
          // Calcular total
          const cantidad = parseFloat(newData[targetIndex].cantidad) || 0;
          const valor = parseFloat(newData[targetIndex].valorFornecedor) || 0;
          newData[targetIndex].total = cantidad * valor;
        } else {
          // Criar nova linha
          const newId = Math.max(...newData.map(item => item.id)) + 1;
          newData.push({
            id: newId,
            producto: columns[0] ? columns[0].trim() : '',
            marca: columns[1] ? columns[1].trim() : '',
            cantidad: columns[2] ? columns[2].trim() : '',
            valorFornecedor: columns[3] ? columns[3].trim() : '',
            total: 0
          });
          
          // Calcular total da nova linha
          const cantidad = parseFloat(columns[2]) || 0;
          const valor = parseFloat(columns[3]) || 0;
          newData[newData.length - 1].total = cantidad * valor;
        }
      });
      
      setManualData(newData);
    } else {
      // Uma linha - comportamento normal
      updateRow(id, field, pastedText);
    }
  };

  // Submeter dados manuais
  const submitManualData = () => {
    const validData = manualData.filter(item => 
      item.producto && item.cantidad && item.valorFornecedor
    );
    
    if (validData.length === 0) {
      alert('Por favor, preencha pelo menos um produto completo');
      return;
    }

    onDataSubmit({
      type: 'manual',
      data: validData,
      summary: {
        totalProducts: validData.length,
        totalValue: validData.reduce((sum, item) => sum + item.total, 0)
      }
    });
  };

  // Upload de arquivo
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
        onDataSubmit({
          type: 'upload',
          data: result.products || [],
          summary: result.summary || {}
        });
      } else {
        alert('Erro ao processar arquivo');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão com o servidor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs de seleção */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload Excel
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Entrada Manual
        </button>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'upload' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload de Planilha Excel
          </h3>
          <p className="text-gray-600 mb-4">
            Selecione um arquivo .xlsx ou .xls com seus produtos
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
          >
            Selecionar Arquivo
          </label>
          {uploadedFile && (
            <p className="mt-2 text-sm text-green-600">
              Arquivo selecionado: {uploadedFile.name}
            </p>
          )}
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Entrada Manual de Produtos
            </h3>
            <button
              onClick={addNewRow}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </button>
          </div>

          {/* Instruções para copy/paste */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Você pode copiar múltiplas linhas do Excel e colar no primeiro campo. 
              O formato deve ser: Produto → Marca → Quantidade → Valor (separados por Tab)
            </p>
          </div>

          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg font-medium text-gray-700">
            <div className="col-span-3">Produto</div>
            <div className="col-span-2">Marca</div>
            <div className="col-span-2">Quantidade</div>
            <div className="col-span-2">Valor Fornecedor (USD)</div>
            <div className="col-span-2">Total (USD)</div>
            <div className="col-span-1">Ações</div>
          </div>

          {/* Linhas de dados */}
          <div className="space-y-2">
            {manualData.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Nome do produto"
                    value={item.producto}
                    onChange={(e) => updateRow(item.id, 'producto', e.target.value)}
                    onPaste={(e) => handlePaste(e, item.id, 'producto')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Marca"
                    value={item.marca}
                    onChange={(e) => updateRow(item.id, 'marca', e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qtd"
                    value={item.cantidad}
                    onChange={(e) => updateRow(item.id, 'cantidad', e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.valorFornecedor}
                    onChange={(e) => updateRow(item.id, 'valorFornecedor', e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <div className="p-2 bg-gray-50 rounded-md font-medium">
                    ${item.total.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeRow(item.id)}
                    disabled={manualData.length === 1}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo e botão de salvar */}
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total de produtos:</span> {manualData.filter(item => item.producto).length} | 
              <span className="font-medium ml-4">Valor total:</span> ${manualData.reduce((sum, item) => sum + item.total, 0).toFixed(2)} USD
            </div>
            <button
              onClick={submitManualData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Continuar para Custos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEntryTab;
