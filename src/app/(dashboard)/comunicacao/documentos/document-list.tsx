"use client";

import { useState } from "react";
import { FileText, ExternalLink, Edit2, Trash2, Lock } from "lucide-react";
import { deleteDocument } from "./actions";
import { CATEGORY_LABELS, DOCUMENT_CATEGORIES } from "@/lib/validators/document";
import type { DocumentData } from "./document-page-client";

const CATEGORY_COLORS: Record<string, string> = {
  ATAS: "bg-purple-100 text-purple-700",
  ORCAMENTOS: "bg-blue-100 text-blue-700",
  SEGUROS: "bg-green-100 text-green-700",
  CONTRATOS: "bg-orange-100 text-orange-700",
  REGULAMENTOS: "bg-yellow-100 text-yellow-700",
  OUTROS: "bg-gray-100 text-gray-700",
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  documents,
  isAdmin,
  onEdit,
}: {
  documents: DocumentData[];
  isAdmin: boolean;
  onEdit: (doc: DocumentData) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setActionError("");
    const result = await deleteDocument(id);
    if (result.error) setActionError(result.error);
    setConfirmDelete(null);
  }

  const filtered = activeCategory
    ? documents.filter((d) => d.category === activeCategory)
    : documents;

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Category tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveCategory(null)}
          className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            activeCategory === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-secondary"
          }`}
        >
          Todos ({documents.length})
        </button>
        {DOCUMENT_CATEGORIES.map((cat) => {
          const count = documents.filter((d) => d.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                activeCategory === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileText size={40} strokeWidth={1.5} />
            <p className="text-sm">Nenhum documento encontrado</p>
            <p className="text-xs">
              {activeCategory
                ? "Nenhum documento nesta categoria"
                : "Adicione documentos para os partilhar com os condóminos"}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Categoria</th>
                <th className="px-6 py-3 font-medium">Ficheiro</th>
                <th className="px-6 py-3 font-medium">Data</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right font-medium">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-border/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{doc.name}</span>
                      {doc.visibility === "ADMIN_ONLY" && (
                        <Lock size={12} className="text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        CATEGORY_COLORS[doc.category] || "bg-muted text-foreground"
                      }`}
                    >
                      {CATEGORY_LABELS[doc.category]}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      {doc.fileName}
                      <ExternalLink size={12} />
                    </a>
                    {doc.fileSize && (
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString("pt-PT")}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(doc)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        {confirmDelete === doc.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-white hover:bg-destructive/90"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(doc.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
