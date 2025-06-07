import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'

const FileUploader = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validações
    const maxSize = 16 * 1024 * 1024 // 16MB
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Tamanho máximo: 16MB')
      return
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não suportado. Use apenas .xlsx ou .xls')
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('http://zflp-processor-production.up.railway.app/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro no upload')
      }

      if (result.success) {
        toast({
          title: "Upload realizado com sucesso!",
          description: `Arquivo ${file.name} processado com sucesso.`,
        })
        onUploadSuccess(result)
      } else {
        throw new Error(result.message || 'Erro no processamento')
      }

    } catch (err) {
      console.error('Erro no upload:', err)
      setError(err.message || 'Erro ao fazer upload do arquivo')
      toast({
        title: "Erro no upload",
        description: err.message || 'Erro ao processar arquivo',
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }, [onUploadSuccess, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: uploading
  })

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card 
        {...getRootProps()} 
        className={`
          cursor-pointer transition-all duration-200 border-2 border-dashed
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <CardContent className="p-12 text-center">
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            {uploading ? (
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
            ) : (
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            )}
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {uploading 
                  ? 'Processando arquivo...' 
                  : isDragActive 
                    ? 'Solte o arquivo aqui' 
                    : 'Faça upload da planilha ZFLP'
                }
              </h3>
              
              {!uploading && (
                <p className="text-gray-600">
                  Arraste e solte um arquivo Excel (.xlsx, .xls) ou clique para selecionar
                </p>
              )}
            </div>

            {!uploading && (
              <Button variant="outline" className="mt-4">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Selecionar Arquivo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Processando arquivo...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {uploadProgress === 100 && !error && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Arquivo processado com sucesso! Você pode agora visualizar e editar os dados.
          </AlertDescription>
        </Alert>
      )}

      {/* File Requirements */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Requisitos do arquivo:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Formato: Excel (.xlsx ou .xls)</li>
            <li>• Tamanho máximo: 16MB</li>
            <li>• Estrutura: Planilha de importação ZFLP</li>
            <li>• Dados: Produtos, custos e valores de importação</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default FileUploader

