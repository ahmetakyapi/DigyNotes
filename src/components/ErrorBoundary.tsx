"use client";
import React, { Component, type ReactNode } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e53e3e]/10">
            <WarningCircleIcon size={28} weight="duotone" color="#e53e3e" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
            Bir şeyler ters gitti
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Sayfa beklenmedik bir hata ile karşılaştı. Lütfen sayfayı yenileyin veya daha sonra
            tekrar deneyin.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--surface-strong)]"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
