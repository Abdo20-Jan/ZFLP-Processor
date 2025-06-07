import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  DollarSign, 
  Package, 
  Calculator, 
  Save, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const DataViewer = ({ data, onDataUpdate }) => {
  const [editedData, setEditedData] = useState(data?.data || {})
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (data?.data) {
      setEditedData(data.data)
      setHasChanges(false)
    }
  }, [data])

  const handleSummaryChange = (field, value) => {
    const numValue = parseFloat(value) || 0
    setEditedData(prev => ({
      ...prev,
      summary: {
        ...prev.summary,
        [field]: numValue
      }
    }))
    setHasChanges(true)
  }

  const handleProductChange = (index, field, value) => {
    const newProducts = [...editedData.products]
    if (field === 'quantidade') {
      newProducts[index][field] = parseInt(value) || 0
    } else if (field === 'fob') {
      newProducts[index][field] = parseFloat(value) || 0
    } else {
      newProducts[index][field] = value
    }
    
    // Recalcular total automaticamente
    if (field === 'quantidade' || field === 'fob') {
      newProducts[index].total = newProducts[index].quantidade * newProducts[index].fob
    }

    setEditedData(prev => ({
      ...prev,
      products: newProducts
    }))
    setHasChanges(true)
  }

  const handleCostChange = (index, field, value) => {
    const newCosts = [...editedData.costs]
    if (field === 'percentual' || field === 'valor') {
      newCosts[index][field] = parseFloat(value) || 0
    } else {
      newCosts[index][field] = value
    }

    setEditedData(prev => ({
      ...prev,
      costs: newCosts
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`https://zflp-processor-production.up.railway.app/api/data/${data.upload_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao salvar')
      }

      if (result.success) {
        onDataUpdate({ ...data, data: result.data })
        setHasChanges(false)
        toast({
          title: "Dados salvos com sucesso!",
          description: "As alterações foram aplicadas.",
        })
      } else {
        throw new Error(result.message || 'Erro ao salvar dados')
      }

    } catch (err) {
      console.error('Erro ao salvar:', err)
      toast({
        title: "Erro ao salvar",
        description: err.message || 'Erro ao salvar alterações',
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value, currency = 'BRL') => {
    const symbol = currency === 'USD' ? '$' : 'R$'
    return `${symbol} ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}`
  }

  if (!editedData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nenhum dado disponível para visualização.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save Button */}
      {hasChanges && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Você tem alterações não salvas. 
            <Button 
              variant="link" 
              className="p-0 ml-2 text-orange-800 underline"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-1 h-3 w-3" />
                  Salvar agora
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Resumo</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span>Custos</span>
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>
                Valores principais da importação (editáveis)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mercadoria">Mercadoria (R$)</Label>
                  <Input
                    id="mercadoria"
                    type="number"
                    step="0.01"
                    value={editedData.summary?.mercadoria || 0}
                    onChange={(e) => handleSummaryChange('mercadoria', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frete_seguro">Frete + Seguro (R$)</Label>
                  <Input
                    id="frete_seguro"
                    type="number"
                    step="0.01"
                    value={editedData.summary?.frete_seguro || 0}
                    onChange={(e) => handleSummaryChange('frete_seguro', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cif">CIF (R$)</Label>
                  <Input
                    id="cif"
                    type="number"
                    step="0.01"
                    value={editedData.summary?.cif || 0}
                    onChange={(e) => handleSummaryChange('cif', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custo_total">Custo Total (R$)</Label>
                  <Input
                    id="custo_total"
                    type="number"
                    step="0.01"
                    value={editedData.summary?.custo_total || 0}
                    onChange={(e) => handleSummaryChange('custo_total', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Importados</CardTitle>
              <CardDescription>
                Lista de produtos com quantidades e valores (editável)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editedData.products?.map((product, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Produto</Label>
                        <Input
                          value={product.produto || ''}
                          onChange={(e) => handleProductChange(index, 'produto', e.target.value)}
                          placeholder="Nome do produto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          value={product.quantidade || 0}
                          onChange={(e) => handleProductChange(index, 'quantidade', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>FOB (US$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={product.fob || 0}
                          onChange={(e) => handleProductChange(index, 'fob', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm text-gray-600">Total: </span>
                      <span className="font-semibold">{formatCurrency(product.total, 'USD')}</span>
                    </div>
                  </Card>
                )) || (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Nenhum produto encontrado.</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Custos Operacionais</CardTitle>
              <CardDescription>
                Custos e taxas da importação (editável)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editedData.costs?.map((cost, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Item de Custo</Label>
                        <Input
                          value={cost.item || ''}
                          onChange={(e) => handleCostChange(index, 'item', e.target.value)}
                          placeholder="Nome do custo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Percentual (%)</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={cost.percentual || 0}
                          onChange={(e) => handleCostChange(index, 'percentual', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cost.valor || 0}
                          onChange={(e) => handleCostChange(index, 'valor', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                )) || (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Nenhum custo encontrado.</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={() => {
            setEditedData(data.data)
            setHasChanges(false)
          }}
          disabled={!hasChanges}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Resetar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default DataViewer

