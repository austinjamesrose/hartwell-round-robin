"use client";

import { Component, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire page.
 */
export class ScheduleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Force a page refresh to reset state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>{this.props.fallbackTitle || "Something went wrong"}</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              An error occurred while displaying this section. This may be due to
              inconsistent schedule data.
            </p>
            {this.state.error && (
              <details className="text-sm">
                <summary className="cursor-pointer hover:underline">
                  Technical details
                </summary>
                <pre className="mt-2 p-2 bg-destructive/10 rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
