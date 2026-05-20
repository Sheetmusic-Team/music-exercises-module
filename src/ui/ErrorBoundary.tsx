// File: ErrorBoundary.tsx - Author: Vicente Alves
import React from 'react';

interface Props {
  children: React.ReactNode;
  onError?: (err: Error, info?: { componentStack?: string }) => void;
}

interface State {
  hasError: boolean;
  error?: Error | null;
  info?: { componentStack?: string } | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const payload = { componentStack: info.componentStack };
    this.setState({ error, info: payload });
    try {
      if (this.props.onError) this.props.onError(error, payload);
    } catch {
      // swallow
    }
    // Also log to console for dev visibility
    console.error('[ErrorBoundary] Render error caught:', error, payload);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, border: '1px solid #e00', background: '#fff6f6' }}>
          <h3 style={{ margin: 0 }}>Se produjo un error al mostrar el ejercicio</h3>
          <p style={{ marginTop: 8, color: '#900' }}>{String(this.state.error?.message ?? 'Error desconocido')}</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Ver detalles</summary>
            <pre>{this.state.info?.componentStack}</pre>
          </details>
          <p>Reintenta con el siguiente ejercicio o revisa la consola para más información.</p>
        </div>
      );
    }

  return this.props.children;
  }
}

export default ErrorBoundary;
