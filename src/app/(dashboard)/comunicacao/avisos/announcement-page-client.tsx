"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AnnouncementList } from "./announcement-list";
import { AnnouncementForm } from "./announcement-form";

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
}: {
  announcements: AnnouncementData[];
  isAdmin: boolean;
  totalMembers: number;
}) {
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
