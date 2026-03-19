"use client";

import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";
import { updateCondominium } from "../actions";

interface CondoData {
  id: string;
  name: string;
  address: string;
  city: string | null;
  nif: string | null;
}

export function CondoInfoCard({ condo }: { condo: CondoData }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: condo.name,
    address: condo.address,
    city: condo.city ?? "",
    nif: condo.nif ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleCancel() {
    setForm({ name: condo.name, address: condo.address, city: condo.city ?? "", nif: condo.nif ?? "" });
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateCondominium(condo.id, form);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEditing(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">Dados do condomínio</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Pencil size={13} />
            Editar
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Morada *</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Cidade</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">NIF</label>
              <input
                name="nif"
                value={form.nif}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Check size={13} />
              {saving ? "A guardar..." : "Guardar"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <X size={13} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nome:</span> {condo.name}
          </p>
          <p>
            <span className="text-muted-foreground">Morada:</span> {condo.address}
          </p>
          {condo.city && (
            <p>
              <span className="text-muted-foreground">Cidade:</span> {condo.city}
            </p>
          )}
          {condo.nif && (
            <p>
              <span className="text-muted-foreground">NIF:</span> {condo.nif}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
