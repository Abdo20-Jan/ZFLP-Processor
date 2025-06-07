import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle, 
  Zap,
  Shield,
  Smartphone
} from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: Upload,
      title: 'Upload Simples',
      description: 'Faça upload de planilhas Excel (.xlsx, .xls) com drag & drop ou clique para selecionar'
    },
    {
      icon: Zap,
      title: 'Processamento Rápido',
      description: 'Análise automática e estruturação dos dados de importação em segundos'
    },
    {
      icon: FileSpreadsheet,
      title: 'Export Excel',
      description: 'Gere planilhas Excel formatadas com fórmulas preservadas e layout profissional'
    },
    {
      icon: FileText,
      title: 'Export PDF',
      description: 'Relatórios em PDF formatados para papel ofício (216x330mm) prontos para impressão'
    },
    {
      icon: CheckCircle,
      title: 'Validação de Dados',
      description: 'Verificação automática de consistência e integridade dos dados processados'
    },
    {
      icon: Shield,
      title: 'Seguro e Confiável',
      description: 'Processamento local seguro com validação rigorosa de arquivos'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Upload da Planilha',
      description: 'Faça upload do arquivo Excel com os dados de importação ZFLP'
    },
    {
      number: '02',
      title: 'Processamento Automático',
      description: 'O sistema analisa e estrutura automaticamente os dados da planilha'
    },
    {
      number: '03',
      title: 'Revisão e Edição',
      description: 'Revise os dados processados e faça ajustes se necessário'
    },
    {
      number: '04',
      title: 'Export e Download',
      description: 'Baixe os relatórios em Excel (com fórmulas) ou PDF formatado'
    }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Processador de Planilhas
            <span className="block text-blue-600">ZFLP</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transforme suas planilhas de importação em relatórios profissionais com 
            export para Excel (com fórmulas) e PDF formatado para impressão.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <Link to="/processor">
              <Upload className="mr-2 h-5 w-5" />
              Começar Agora
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6">
            <Smartphone className="mr-2 h-5 w-5" />
            Ver Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Funcionalidades Principais</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Uma solução completa para processamento e transformação de dados de importação
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Como Funciona</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Processo simples e intuitivo em 4 etapas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                {step.number}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para Começar?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Faça upload da sua planilha ZFLP e transforme seus dados em relatórios profissionais em minutos.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
            <Link to="/processor">
              <Upload className="mr-2 h-5 w-5" />
              Processar Planilha
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer Info */}
      <section className="text-center text-gray-600 space-y-2">
        <p>
          <strong>Formatos suportados:</strong> Excel (.xlsx, .xls)
        </p>
        <p>
          <strong>Exports disponíveis:</strong> Excel com fórmulas, PDF para papel ofício
        </p>
        <p>
          <strong>Tamanho máximo:</strong> 16MB por arquivo
        </p>
      </section>
    </div>
  )
}

export default HomePage

