"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { AnnouncementList } from "./announcement-list";
const AnnouncementForm = dynamic(() => import("./announcement-form").then(m => m.AnnouncementForm));

export interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  authorName: string;
  createdAt: string;
  readCount: number;
}

export function AnnouncementPageClient({
  announcements,
  isAdmin,
  totalMembers,
  page,
  totalPages,
  totalAnnouncements,
}: {
  announcements: AnnouncementData[];
  isAdmin: boolean;
  totalMembers: number;
  page: number;
  totalPages: number;
  totalAnnouncements: number;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementData | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avisos</h1>
          <p className="text-sm text-muted-foreground">
            Comunicados e avisos aos condóminos
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Novo aviso
          </button>
        )}
      </div>

      <AnnouncementList
        announcements={announcements}
        isAdmin={isAdmin}
        totalMembers={totalMembers}
        onEdit={(a) => setEditingAnnouncement(a)}
      />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {totalAnnouncements} aviso{totalAnnouncements !== 1 ? "s" : ""} · Página {page} de {totalPages}
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

      {showForm && <AnnouncementForm onClose={() => setShowForm(false)} />}
      {editingAnnouncement && (
        <AnnouncementForm
          existingAnnouncement={editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
        />
      )}
    </div>
  );
}
