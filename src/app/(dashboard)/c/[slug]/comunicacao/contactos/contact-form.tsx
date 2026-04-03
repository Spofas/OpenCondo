"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { contactSchema, type ContactInput, CONTACT_CATEGORIES } from "@/lib/validators/contact";
import { createContact, updateContact } from "./actions";
import { useCondominium } from "@/lib/condominium-context";
import type { ContactInfo } from "./contacts-page-client";
import { UI } from "@/lib/ui-strings";

export function ContactForm({
  contact,
  onClose,
}: {
  contact: ContactInfo | null;
  onClose: () => void;
}) {
  const { condominiumId } = useCondominium();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name ?? "",
      phone: contact?.phone ?? "",
      email: contact?.email ?? "",
      category: contact?.category ?? "outros",
      notes: contact?.notes ?? "",
      visibility: (contact?.visibility as "ALL" | "ADMIN_ONLY") ?? "ALL",
    },
  });

  async function onSubmit(data: ContactInput) {
    setSaving(true);
    setError(null);

    const result = contact
      ? await updateContact(condominiumId, contact.id, data)
      : await createContact(condominiumId, data);

    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {contact ? "Editar contacto" : "Novo contacto"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium text-foreground">Nome *</label>
            <input
              id="name"
              {...register("name")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Ex: Bombeiros Voluntários"
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-medium text-foreground">Telefone</label>
            <input
              id="phone"
              {...register("phone")}
              type="tel"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Ex: 217 123 456"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-foreground">Email</label>
            <input
              id="email"
              {...register("email")}
              type="email"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Ex: geral@empresa.pt"
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="mb-1 block text-xs font-medium text-foreground">Categoria *</label>
            <select
              id="category"
              {...register("category")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {CONTACT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1 block text-xs font-medium text-foreground">Notas</label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Ex: Horário de atendimento, pessoa de contacto..."
            />
          </div>

          {/* Visibility */}
          <div>
            <label htmlFor="visibility" className="mb-1 block text-xs font-medium text-foreground">Visibilidade</label>
            <select
              id="visibility"
              {...register("visibility")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Todos os membros</option>
              <option value="ADMIN_ONLY">Apenas administradores</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {UI.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? UI.saving : contact ? UI.save : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
