"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { DocumentList } from "./document-list";
import { DocumentForm } from "./document-form";

export interface DocumentData {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  visibility: string;
  createdAt: string;
}

export function DocumentPageClient({
  documents,
  isAdmin,
}: {
  documents: DocumentData[];
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentData | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Arquivo de documentos do condomínio
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Upload size={16} />
            Novo documento
          </button>
        )}
      </div>

      <DocumentList
        documents={documents}
        isAdmin={isAdmin}
        onEdit={(d) => setEditingDocument(d)}
      />

      {showForm && <DocumentForm onClose={() => setShowForm(false)} />}
      {editingDocument && (
        <DocumentForm
          existingDocument={editingDocument}
          onClose={() => setEditingDocument(null)}
        />
      )}
    </div>
  );
}
