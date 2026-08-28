import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

/**
 * Last resort for a render-time crash. Without it a thrown error unmounts the
 * whole tree and leaves a blank page with nothing in the UI to act on.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ParcelFlow] render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold">This page hit an unexpected error</h1>
          <p className="text-muted mt-1 max-w-md text-sm">
            Reloading usually clears it. If it keeps happening, the details are in the browser
            console.
          </p>
        </div>
        <pre className="surface-sunken max-w-lg overflow-x-auto rounded-lg p-3 text-left font-mono text-[11px]">
          {error.message}
        </pre>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button variant="secondary" onClick={() => this.setState({ error: null })}>
            Try to continue
          </Button>
        </div>
      </div>
    );
  }
}
