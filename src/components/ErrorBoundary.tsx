import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-display font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
            An unexpected error occurred. Try refreshing the page — if it keeps happening, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Refresh page
          </button>
          {this.state.error && (
            <p className="mt-4 text-xs text-muted-foreground font-mono opacity-50">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
