import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Home, Upload } from 'lucide-react'

const Header = () => {
  const location = useLocation()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ZFLP Processor</h1>
              <p className="text-sm text-gray-600">Processador de Planilhas de Importação</p>
            </div>
          </Link>

          {/* Navegação */}
          <nav className="flex items-center space-x-4">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
            >
              <Link to="/">
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Link>
            </Button>
            
            <Button
              variant={location.pathname === '/processor' ? 'default' : 'ghost'}
              asChild
              className="flex items-center space-x-2"
            >
              <Link to="/processor">
                <Upload className="h-4 w-4" />
                <span>Processador</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header

