"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Phone, Plus } from "lucide-react";
import { ContactList } from "./contact-list";
const ContactForm = dynamic(() => import("./contact-form").then(m => m.ContactForm));

export interface ContactInfo {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: string | null;
  notes: string | null;
  visibility: string;
}

export function ContactsPageClient({
  contacts,
  isAdmin,
  page = 1,
  totalPages = 1,
  totalContacts = 0,
}: {
  contacts: ContactInfo[];
  isAdmin: boolean;
  page?: number;
  totalPages?: number;
  totalContacts?: number;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(null);

  function handleEdit(contact: ContactInfo) {
    setEditingContact(contact);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingContact(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
          <p className="text-sm text-muted-foreground">
            Contactos úteis do condomínio
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditingContact(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Novo contacto
          </button>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card text-muted-foreground">
          <Phone size={32} strokeWidth={1.5} />
          <p className="text-sm">Nenhum contacto registado.</p>
          {isAdmin && (
            <p className="text-xs">Adicione contactos úteis para os condóminos.</p>
          )}
        </div>
      ) : (
        <ContactList
          contacts={contacts}
          isAdmin={isAdmin}
          onEdit={handleEdit}
        />
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {totalContacts} contacto{totalContacts !== 1 ? "s" : ""} · Página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => router.push(`?page=${page - 1}`)}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => router.push(`?page=${page + 1}`)}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Seguinte
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <ContactForm
          contact={editingContact}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
