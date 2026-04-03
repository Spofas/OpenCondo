"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import {
  documentSchema,
  type DocumentInput,
  DOCUMENT_CATEGORIES,
  DOCUMENT_VISIBILITY,
  CATEGORY_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/validators/document";
import { createDocument, updateDocument } from "./actions";
import { useCondominium } from "@/lib/condominium-context";
import type { DocumentData } from "./document-page-client";
import { UI } from "@/lib/ui-strings";

interface DocumentFormProps {
  onClose: () => void;
  existingDocument?: DocumentData;
}

export function DocumentForm({ onClose, existingDocument }: DocumentFormProps) {
  const { condominiumId } = useCondominium();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingDocument;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: existingDocument
      ? {
          name: existingDocument.name,
          category: existingDocument.category as DocumentInput["category"],
          fileUrl: existingDocument.fileUrl,
          fileName: existingDocument.fileName,
          fileSize: existingDocument.fileSize || undefined,
          visibility: existingDocument.visibility as DocumentInput["visibility"],
        }
      : {
          name: "",
          category: "OUTROS",
          fileUrl: "",
          fileName: "",
          visibility: "ALL",
        },
  });

  async function onSubmit(data: DocumentInput) {
    setIsSubmitting(true);
    setError("");

    const result = isEditing
      ? await updateDocument(condominiumId, existingDocument.id, data)
      : await createDocument(condominiumId, data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-card md:bg-black/50 md:flex md:items-start md:justify-center md:p-4 md:pt-16">
      <div className="w-full md:max-w-lg md:rounded-xl md:border md:border-border bg-card md:shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isEditing ? "Editar documento" : "Novo documento"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
              Nome do documento
            </label>
            <input
              id="name"
              type="text"
              placeholder="Ex: Ata da assembleia de março 2026"
              {...register("name")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Category & Visibility */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-foreground">
                Categoria
              </label>
              <select
                id="category"
                {...register("category")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="visibility" className="mb-1 block text-sm font-medium text-foreground">
                Visibilidade
              </label>
              <select
                id="visibility"
                {...register("visibility")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {DOCUMENT_VISIBILITY.map((v) => (
                  <option key={v} value={v}>
                    {VISIBILITY_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <FileUpload
              condominiumId={condominiumId}
              value={watch("fileUrl") || ""}
              onChange={(url, name, size) => {
                setValue("fileUrl", url, { shouldValidate: true });
                if (name) setValue("fileName", name);
                if (size) setValue("fileSize", size);
              }}
              label="Ficheiro"
              helperText="PDF, imagens, Word, Excel ou CSV (máx. 10 MB)"
            />
            {errors.fileUrl && (
              <p className="mt-1 text-xs text-destructive">{errors.fileUrl.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {UI.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting
                ? UI.saving
                : isEditing
                  ? "Guardar alterações"
                  : "Adicionar documento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
