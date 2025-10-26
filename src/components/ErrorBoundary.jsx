import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error Boundary para capturar erros de renderização
 * e prevenir que toda a aplicação quebre
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary capturou um erro:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-4 border-red-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Oops! Algo deu errado
                </h1>
                <p className="text-gray-600 mt-1">
                  Ocorreu um erro inesperado na aplicação
                </p>
              </div>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                <h3 className="font-bold text-red-800 mb-2">Detalhes do erro:</h3>
                <p className="text-sm text-red-700 font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-red-800 hover:text-red-900">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-64 bg-red-100 p-3 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={this.handleReset}
                className="bg-gradient-to-r from-[#0066B3] to-[#002855] hover:from-[#002855] hover:to-[#0066B3] text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>

              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
                className="border-[#0066B3] text-[#0066B3] hover:bg-[#0066B3] hover:text-white"
              >
                Voltar ao Início
              </Button>
            </div>

            {!import.meta.env.DEV && (
              <p className="text-sm text-gray-500 mt-6">
                Se o problema persistir, entre em contato com o suporte técnico.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
