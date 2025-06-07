import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trash2, Plus } from 'lucide-react';

const DataEntryTab = ({ onDataChange, onNext }) => {
  const [products, setProducts] = useState([
    { id: Date.now(), produto: '', quantidade: '', valor: '' }
  ]);

  const updateProduct = useCallback((id, field, value) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  }, []);

  const addProduct = useCallback(() => {
    const newProduct = { 
      id: Date.now() + Math.random(), 
      produto: '', 
      quantidade: '', 
      valor: '' 
    };
    setProducts(prev => [...prev, newProduct]);
  }, []);

  const removeProduct = useCallback((id) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  }, []);

  const calculateTotal = useCallback(() => {
    return products.reduce((total, product) => {
      const quantidade = parseFloat(product.quantidade) || 0;
      const valor = parseFloat(product.valor) || 0;
      return total + (quantidade * valor);
    }, 0);
  }, [products]);

  const handleContinue = useCallback(() => {
    const validProducts = products.filter(p => p.produto && p.quantidade && p.valor);
    if (validProducts.length === 0) {
      alert('Adicione pelo menos um produto válido');
      return;
    }
    onDataChange(validProducts);
    onNext();
  }, [products, onDataChange, onNext]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrada Manual de Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 font-medium">
            <div>Produto</div>
            <div>Quantidade</div>
            <div>Valor Fornecedor (USD)</div>
            <div>Ações</div>
          </div>
          
          {products.map((product) => (
            <div key={product.id} className="grid grid-cols-4 gap-4 items-center">
              <Input
                placeholder="Nome do produto"
                value={product.produto}
                onChange={(e) => updateProduct(product.id, 'produto', e.target.value)}
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
            <Button onClick={handleContinue}>
              Continuar para Custos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataEntryTab;
