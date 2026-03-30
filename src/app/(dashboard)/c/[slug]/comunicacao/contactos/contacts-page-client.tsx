"use client";

import { useState } from "react";
import { Phone, Plus } from "lucide-react";
import { ContactList } from "./contact-list";
import { ContactForm } from "./contact-form";

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
}: {
  contacts: ContactInfo[];
  isAdmin: boolean;
}) {
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

      {showForm && (
        <ContactForm
          contact={editingContact}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
