"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { saveNotificationPreferences } from "../../../actions";
import { useCondominium } from "@/lib/condominium-context";
import { NOTIFICATION_TYPES } from "@/lib/validators/notification-preferences";

interface Props {
  preferences: Record<string, boolean>;
}

export function NotificationPreferences({ preferences }: Props) {
  const { condominiumId } = useCondominium();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(preferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleToggle(key: string) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await saveNotificationPreferences(condominiumId, updated);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      setPrefs(prefs); // revert
    } else {
      setSuccess("Preferências atualizadas");
      setTimeout(() => setSuccess(null), 2000);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell size={18} className="text-muted-foreground" />
        <h2 className="text-lg font-semibold text-card-foreground">Notificações por email</h2>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Escolha quais notificações pretende receber por email para este condomínio.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="divide-y divide-border">
        {NOTIFICATION_TYPES.map((notif) => (
          <div key={notif.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-foreground">{notif.label}</p>
              <p className="text-xs text-muted-foreground">{notif.description}</p>
            </div>
            <button
              onClick={() => handleToggle(notif.key)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 ${
                prefs[notif.key] ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={prefs[notif.key]}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  prefs[notif.key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
