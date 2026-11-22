import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F6FA] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E6E5ED] rounded-xl p-8 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-[#FBF6E9] border border-[#E5C66F] flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5 text-[#0C0843]" />
            </div>
            <h1 className="text-xl font-bold text-[#0C0843] mb-2">
              ALERT MFB HRMIS — Application Notice
            </h1>
            <p className="text-sm text-[#6B6B80] mb-4 leading-relaxed">
              The system encountered an unexpected issue while processing your request. Your data
              remains safe.
            </p>
            <div className="bg-[#F6F6FA] border border-[#E6E5ED] rounded-lg p-3 mb-6 text-xs font-mono text-[#17172B] break-words max-h-40 overflow-auto">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0C0843] text-white text-sm font-medium rounded-lg hover:bg-[#17134F] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
