"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  announcementSchema,
  type AnnouncementInput,
  ANNOUNCEMENT_CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/validators/announcement";
import { createAnnouncement, updateAnnouncement } from "./actions";
import type { AnnouncementData } from "./announcement-page-client";

interface AnnouncementFormProps {
  onClose: () => void;
  existingAnnouncement?: AnnouncementData;
}

export function AnnouncementForm({ onClose, existingAnnouncement }: AnnouncementFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingAnnouncement;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: existingAnnouncement
      ? {
          title: existingAnnouncement.title,
          body: existingAnnouncement.body,
          category: existingAnnouncement.category,
          pinned: existingAnnouncement.pinned,
        }
      : {
          title: "",
          body: "",
          category: "GERAL",
          pinned: false,
        },
  });

  async function onSubmit(data: AnnouncementInput) {
    setIsSubmitting(true);
    setError("");

    const result = isEditing
      ? await updateAnnouncement(existingAnnouncement.id, data)
      : await createAnnouncement(data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-card md:bg-black/50 md:flex md:items-start md:justify-center md:p-4 md:pt-16">
      <div className="w-full md:max-w-lg md:rounded-xl md:border md:border-border bg-card md:shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isEditing ? "Editar aviso" : "Novo aviso"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Título
            </label>
            <input
              type="text"
              placeholder="Ex: Aviso de obras no piso 2"
              {...register("title")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category & Pinned */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Categoria
              </label>
              <select
                {...register("category")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  {...register("pinned")}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                Fixar no topo
              </label>
            </div>
          </div>

          {/* Body */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Conteúdo
            </label>
            <textarea
              rows={6}
              placeholder="Escreva o conteúdo do aviso..."
              {...register("body")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
            {errors.body && (
              <p className="mt-1 text-xs text-destructive">{errors.body.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting
                ? "A guardar..."
                : isEditing
                  ? "Guardar alterações"
                  : "Publicar aviso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
