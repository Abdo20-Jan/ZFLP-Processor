import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const ExportOptions = ({ uploadId }) => {
  const [downloading, setDownloading] = useState({})
  const { toast } = useToast()

  const handleDownload = async (type, endpoint, filename) => {
    setDownloading(prev => ({ ...prev, [type]: true }))
    
    try {
      const response = await fetch(`http://zflp-processor-production.up.railway.app/api/export/${endpoint}/${uploadId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro no download')
      }

      // Criar blob e download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download concluído!",
        description: `Arquivo ${filename} baixado com sucesso.`,
      })

    } catch (err) {
      console.error('Erro no download:', err)
      toast({
        title: "Erro no download",
        description: err.message || 'Erro ao baixar arquivo',
        variant: "destructive",
      })
    } finally {
      setDownloading(prev => ({ ...prev, [type]: false }))
    }
  }

  const exportOptions = [
    {
      id: 'excel',
      title: 'Excel com Fórmulas',
      description: 'Planilha Excel formatada com fórmulas preservadas e layout profissional',
      icon: FileSpreadsheet,
      endpoint: 'excel',
      filename: 'relatorio_zflp.xlsx',
      color: 'green',
      features: [
        'Fórmulas automáticas preservadas',
        'Formatação profissional',
        'Múltiplas abas organizadas',
        'Pronto para edição'
      ]
    },
    {
      id: 'excel-template',
      title: 'Template Editável',
      description: 'Template Excel editável com fórmulas dinâmicas para modificações',
      icon: FileSpreadsheet,
      endpoint: 'excel-template',
      filename: 'template_editavel_zflp.xlsx',
      color: 'blue',
      features: [
        'Campos editáveis',
        'Fórmulas dinâmicas',
        'Linhas extras para novos dados',
        'Cálculos automáticos'
      ]
    },
    {
      id: 'pdf',
      title: 'Relatório PDF',
      description: 'Relatório completo em PDF formatado para papel ofício (216x330mm)',
      icon: FileText,
      endpoint: 'pdf',
      filename: 'relatorio_zflp.pdf',
      color: 'red',
      features: [
        'Formato papel ofício',
        'Pronto para impressão',
        'Layout profissional',
        'Todas as seções incluídas'
      ]
    },
    {
      id: 'pdf-summary',
      title: 'Resumo PDF',
      description: 'Relatório resumido em PDF com apenas os totais principais',
      icon: FileText,
      endpoint: 'pdf-summary',
      filename: 'resumo_zflp.pdf',
      color: 'orange',
      features: [
        'Apenas totais principais',
        'Formato compacto',
        'Ideal para apresentações',
        'Rápida visualização'
      ]
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      green: 'border-green-200 bg-green-50 hover:bg-green-100',
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      red: 'border-red-200 bg-red-50 hover:bg-red-100',
      orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100'
    }
    return colors[color] || colors.blue
  }

  const getIconColor = (color) => {
    const colors = {
      green: 'text-green-600',
      blue: 'text-blue-600',
      red: 'text-red-600',
      orange: 'text-orange-600'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Opções de Export</h2>
        <p className="text-gray-600">
          Escolha o formato desejado para baixar seus dados processados
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportOptions.map((option) => (
          <Card 
            key={option.id} 
            className={`transition-all duration-200 ${getColorClasses(option.color)}`}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg">
                  <option.icon className={`h-6 w-6 ${getIconColor(option.color)}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features List */}
              <ul className="text-sm text-gray-600 space-y-1">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Download Button */}
              <Button
                onClick={() => handleDownload(option.id, option.endpoint, option.filename)}
                disabled={downloading[option.id]}
                className="w-full"
                variant={option.color === 'green' ? 'default' : 'outline'}
              >
                {downloading[option.id] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar {option.title}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Download All Section */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-purple-600" />
            <span>Download Completo</span>
          </CardTitle>
          <CardDescription>
            Baixe todos os formatos de uma vez para ter todas as opções disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={async () => {
                for (const option of exportOptions) {
                  await handleDownload(option.id, option.endpoint, option.filename)
                  // Pequena pausa entre downloads
                  await new Promise(resolve => setTimeout(resolve, 1000))
                }
              }}
              disabled={Object.values(downloading).some(Boolean)}
              className="flex-1"
              variant="outline"
            >
              {Object.values(downloading).some(Boolean) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Todos os Formatos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica:</strong> O Excel com fórmulas é ideal para edições futuras, 
          enquanto o PDF é perfeito para impressão e apresentações. 
          O template editável permite modificar dados e recalcular automaticamente.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default ExportOptions

