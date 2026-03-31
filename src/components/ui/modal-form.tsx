"use client";

import { X } from "lucide-react";

interface ModalFormProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  error?: string;
  isSubmitting?: boolean;
  submitText: string;
  loadingText?: string;
  maxWidth?: "lg" | "2xl";
  children: React.ReactNode;
}

const maxWidthClasses = {
  lg: "md:max-w-lg",
  "2xl": "md:max-w-2xl",
};

export function ModalForm({
  onClose,
  onSubmit,
  title,
  error,
  isSubmitting = false,
  submitText,
  loadingText = "A guardar...",
  maxWidth = "lg",
  children,
}: ModalFormProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-card md:bg-black/50 md:flex md:items-start md:justify-center md:p-4 md:pt-16">
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} md:rounded-xl md:border md:border-border bg-card md:shadow-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {children}

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? loadingText : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
