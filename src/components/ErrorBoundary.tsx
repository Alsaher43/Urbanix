import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Captura errores de render para evitar la pantalla en blanco. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.assign('/');
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-content">Algo salió mal</h1>
            <p className="mt-1 max-w-md text-sm text-content-2">
              Se produjo un error inesperado en la interfaz. Puedes volver al inicio e intentarlo
              de nuevo. Si el problema persiste, contacta al administrador.
            </p>
          </div>
          <pre className="max-w-lg overflow-auto rounded-lg bg-surface-2 p-3 text-left text-2xs text-content-3">
            {this.state.error.message}
          </pre>
          <Button onClick={this.handleReset}>
            <RotateCcw className="h-4 w-4" /> Volver al inicio
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
