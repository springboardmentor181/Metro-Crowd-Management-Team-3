"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
  
  fallback?: (error: Error, retry: () => void) => ReactNode;
  
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.retry);
    }

    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-3xl border border-red-500/20 bg-red-500/5 p-10 text-center">
        <div className="rounded-full bg-red-500/10 p-3">
          <AlertTriangle className="text-red-500" size={28} />
        </div>
        <div>
          <p className="text-lg font-semibold">
            Something went wrong{this.props.label ? ` loading ${this.props.label}` : ""}.
          </p>
          <p className="mt-1 text-sm text-muted">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={this.retry} variant="secondary">
            <RefreshCcw size={16} />
            Try again
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
