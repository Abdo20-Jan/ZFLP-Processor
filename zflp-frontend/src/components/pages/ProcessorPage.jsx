import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import DataEntryTab from '../DataEntryTab';
import CostsTab from '../CostsTab';
import ResultsTab from '../ResultsTab';

const ProcessorPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [productData, setProductData] = useState([]);
  const [calculationResults, setCalculationResults] = useState(null);

  const steps = [
    { id: 1, title: 'Entrada de Dados', description: 'Upload Excel ou entrada manual' },
    { id: 2, title: 'Custos', description: 'Configurar custos fixos, variáveis e tributos' },
    { id: 3, title: 'Resultados', description: 'Ver pro-rateio e exportar' }
  ];

  const handleDataSubmit = (data) => {
    setProductData(data.data);
    setCurrentStep(2);
  };

  const handleCalculationComplete = (results) => {
    setCalculationResults(results);
    setCurrentStep(3);
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(`http://zflp-processor-production.up.railway.app/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productData,
          calculationResults
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `zflp-rateio.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erro ao exportar arquivo');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão com o servidor');
    }
  };

  const goToStep = (step) => {
    if (step === 1) {
      setCurrentStep(1);
    } else if (step === 2 && productData.length > 0) {
      setCurrentStep(2);
    } else if (step === 3 && calculationResults) {
      setCurrentStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ZFLP Processor - Argentina
          </h1>
          <p className="text-gray-600">
            Sistema de pro-rateio de custos para importação - Valores em USD
          </p>
        </div>

        {/* Indicador de Progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center cursor-pointer ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  onClick={() => goToStep(step.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep > step.id
                        ? 'bg-green-500 border-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="ml-3 text-left">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {currentStep === 1 && (
            <DataEntryTab onDataSubmit={handleDataSubmit} />
          )}
          
          {currentStep === 2 && (
            <CostsTab 
              productData={productData}
              onCalculationComplete={handleCalculationComplete}
            />
          )}
          
          {currentStep === 3 && (
            <ResultsTab 
              calculationResults={calculationResults}
              onExport={handleExport}
            />
          )}
        </div>

        {/* Navegação */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </button>

          <div className="text-sm text-gray-500 flex items-center">
            Etapa {currentStep} de {steps.length}
          </div>

          <button
            onClick={() => {
              if (currentStep === 1 && productData.length > 0) {
                setCurrentStep(2);
              } else if (currentStep === 2 && calculationResults) {
                setCurrentStep(3);
              }
            }}
            disabled={
              (currentStep === 1 && productData.length === 0) ||
              (currentStep === 2 && !calculationResults) ||
              currentStep === 3
            }
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Informações da Sessão */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex justify-center space-x-6">
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

