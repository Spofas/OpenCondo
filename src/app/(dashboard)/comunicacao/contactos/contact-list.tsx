"use client";

import { useState } from "react";
import { Phone, Mail, Pencil, Trash2, Eye, EyeOff, StickyNote } from "lucide-react";
import { deleteContact } from "./actions";
import type { ContactInfo } from "./contacts-page-client";
import { CONTACT_CATEGORIES } from "@/lib/validators/contact";

const categoryLabels: Record<string, string> = Object.fromEntries(
  CONTACT_CATEGORIES.map((c) => [c.value, c.label])
);

const categoryColors: Record<string, string> = {
  emergencia: "bg-red-100 text-red-700",
  servicos: "bg-blue-100 text-blue-700",
  manutencao: "bg-amber-100 text-amber-700",
  limpeza: "bg-green-100 text-green-700",
  elevador: "bg-purple-100 text-purple-700",
  seguranca: "bg-slate-100 text-slate-700",
  jardinagem: "bg-emerald-100 text-emerald-700",
  seguros: "bg-indigo-100 text-indigo-700",
  administracao: "bg-cyan-100 text-cyan-700",
  juridico: "bg-orange-100 text-orange-700",
  outros: "bg-gray-100 text-gray-700",
};

export function ContactList({
  contacts,
  isAdmin,
  onEdit,
}: {
  contacts: ContactInfo[];
  isAdmin: boolean;
  onEdit: (contact: ContactInfo) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Group by category
  const grouped = contacts.reduce<Record<string, ContactInfo[]>>((acc, c) => {
    const cat = c.category || "outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  // Sort categories: emergencia first, then alphabetically
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === "emergencia") return -1;
    if (b === "emergencia") return 1;
    return (categoryLabels[a] ?? a).localeCompare(categoryLabels[b] ?? b, "pt");
  });

  async function handleDelete(id: string) {
    const result = await deleteContact(id);
    if (result.error) {
      setError(result.error);
      setTimeout(() => setError(null), 4000);
    }
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {sortedCategories.map((cat) => (
        <div key={cat}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[cat] ?? categoryColors.outros}`}
            >
              {categoryLabels[cat] ?? cat}
            </span>
            <span className="text-xs text-muted-foreground">
              ({grouped[cat].length})
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[cat].map((contact) => (
              <div
                key={contact.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {contact.name}
                  </h3>
                  {isAdmin && (
                    <span className="flex items-center gap-1" title={contact.visibility === "ALL" ? "Visível a todos" : "Só administradores"}>
                      {contact.visibility === "ALL" ? (
                        <Eye size={12} className="text-green-600" />
                      ) : (
                        <EyeOff size={12} className="text-muted-foreground" />
                      )}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Phone size={12} />
                      {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Mail size={12} />
                      {contact.email}
                    </a>
                  )}
                  {contact.notes && (
                    <p className="flex items-start gap-2">
                      <StickyNote size={12} className="mt-0.5 shrink-0" />
                      {contact.notes}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-2">
                    <button
                      onClick={() => onEdit(contact)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    {confirmDelete === contact.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-destructive hover:underline"
                        >
                          Sim, eliminar
                        </button>
                        <span className="text-muted-foreground">/</span>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-muted-foreground hover:underline"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(contact.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
