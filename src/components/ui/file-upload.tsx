"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";

interface FileUploadProps {
  condominiumId: string;
  value: string;
  onChange: (url: string, fileName?: string, fileSize?: number) => void;
  accept?: string;
  label?: string;
  helperText?: string;
}

export function FileUpload({
  condominiumId,
  value,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv",
  label = "Ficheiro",
  helperText,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/upload?condominiumId=${encodeURIComponent(condominiumId)}`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao enviar ficheiro");
        setUploading(false);
        return;
      }

      const data = await res.json();
      setFileName(data.fileName);
      onChange(data.url, data.fileName, data.fileSize);
    } catch {
      setError("Erro ao enviar ficheiro");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function handleClear() {
    onChange("", undefined, undefined);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayName = fileName || (value ? value.split("/").pop() : "");

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <FileText size={16} className="shrink-0 text-primary" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
          >
            {displayName}
          </a>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              A enviar...
            </>
          ) : (
            <>
              <Upload size={16} />
              Carregar ficheiro
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Fallback: paste URL manually */}
      {!value && !uploading && (
        <div className="mt-2">
          <input
            type="text"
            placeholder="Ou cole um link (Google Drive, Dropbox, etc.)"
            onBlur={(e) => {
              const url = e.target.value.trim();
              if (url) onChange(url);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const url = (e.target as HTMLInputElement).value.trim();
                if (url) onChange(url);
              }
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {helperText && !value && (
        <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
      )}

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
