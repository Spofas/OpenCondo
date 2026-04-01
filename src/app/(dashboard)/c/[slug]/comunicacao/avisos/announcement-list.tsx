"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Megaphone, Pin, Edit2, Trash2, Eye } from "lucide-react";
import { deleteAnnouncement, togglePin } from "./actions";
import { useCondominium } from "@/lib/condominium-context";
import { CATEGORY_LABELS } from "@/lib/validators/announcement";
import type { AnnouncementData } from "./announcement-page-client";
import { UI } from "@/lib/ui-strings";

const CATEGORY_COLORS: Record<string, string> = {
  GERAL: "bg-blue-100 text-blue-700",
  OBRAS: "bg-orange-100 text-orange-700",
  MANUTENCAO: "bg-yellow-100 text-yellow-700",
  ASSEMBLEIA: "bg-purple-100 text-purple-700",
  URGENTE: "bg-red-100 text-red-700",
};

export function AnnouncementList({
  announcements,
  isAdmin,
  totalMembers,
  onEdit,
}: {
  announcements: AnnouncementData[];
  isAdmin: boolean;
  totalMembers: number;
  onEdit: (announcement: AnnouncementData) => void;
}) {
  const { condominiumId } = useCondominium();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [, startTransition] = useTransition();

  type OptimisticAction =
    | { type: "delete"; id: string }
    | { type: "togglePin"; id: string };

  const [optimisticAnnouncements, addOptimistic] = useOptimistic(
    announcements,
    (state, action: OptimisticAction) => {
      if (action.type === "delete") return state.filter((a) => a.id !== action.id);
      if (action.type === "togglePin")
        return state.map((a) => (a.id === action.id ? { ...a, pinned: !a.pinned } : a));
      return state;
    }
  );

  async function handleDelete(id: string) {
    setActionError("");
    setConfirmDelete(null);
    startTransition(async () => {
      addOptimistic({ type: "delete", id });
      const result = await deleteAnnouncement(condominiumId, id);
      if (result.error) setActionError(result.error);
    });
  }

  async function handleTogglePin(id: string) {
    setActionError("");
    startTransition(async () => {
      addOptimistic({ type: "togglePin", id });
      const result = await togglePin(condominiumId, id);
      if (result.error) setActionError(result.error);
    });
  }

  if (optimisticAnnouncements.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Megaphone size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhum aviso publicado</p>
          <p className="text-xs">Publique avisos para comunicar com os condóminos</p>
        </div>
      </div>
    );
  }

  // Pinned first, then by date
  const sorted = [...optimisticAnnouncements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="space-y-4">
        {sorted.map((announcement) => (
          <div
            key={announcement.id}
            className={`rounded-xl border bg-card p-5 ${
              announcement.pinned ? "border-primary/30 bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  {announcement.pinned && (
                    <Pin size={14} className="text-primary flex-shrink-0" />
                  )}
                  <h3 className="text-base font-semibold text-foreground">
                    {announcement.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      CATEGORY_COLORS[announcement.category] || "bg-muted text-foreground"
                    }`}
                  >
                    {CATEGORY_LABELS[announcement.category] || announcement.category}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground/80">
                  {announcement.body}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{announcement.authorName}</span>
                  <span>
                    {new Date(announcement.createdAt).toLocaleDateString("pt-PT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {announcement.readCount}/{totalMembers}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePin(announcement.id)}
                    className={`rounded-lg p-1.5 ${
                      announcement.pinned
                        ? "text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title={announcement.pinned ? "Desafixar" : "Fixar"}
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    onClick={() => onEdit(announcement)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  {confirmDelete === announcement.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-white hover:bg-destructive/90"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {UI.confirmNo}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(announcement.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title={UI.delete}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
