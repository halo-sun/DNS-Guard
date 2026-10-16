import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("DNS Guard UI error boundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-ink">
          <div className="max-w-md w-full bg-surface-1 border border-hairline rounded-lg p-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-severity-critical/15 text-severity-critical flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 className="text-base font-semibold mb-1">Application Render Exception</h2>
            <p className="text-xs text-ink-subtle mb-4">
              {this.state.error?.message || "An unexpected rendering fault occurred."}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
