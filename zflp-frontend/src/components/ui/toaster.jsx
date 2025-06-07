import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const Toaster = () => {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  const getIcon = (variant) => {
    switch (variant) {
      case 'destructive':
        return <AlertCircle className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getVariantClasses = (variant) => {
    switch (variant) {
      case 'destructive':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800'
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Alert 
          key={toast.id} 
          className={`${getVariantClasses(toast.variant)} shadow-lg animate-in slide-in-from-right-full`}
        >
          <div className="flex items-start space-x-2">
            {getIcon(toast.variant)}
            <div className="flex-1 space-y-1">
              {toast.title && (
                <div className="font-medium">{toast.title}</div>
              )}
              {toast.description && (
                <AlertDescription className="text-sm">
                  {toast.description}
                </AlertDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => dismiss(toast.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  )
}

export { Toaster }

