"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  announcementSchema,
  type AnnouncementInput,
  ANNOUNCEMENT_CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/validators/announcement";
import { createAnnouncement, updateAnnouncement } from "./actions";
import { useCondominium } from "@/lib/condominium-context";
import { ModalForm } from "@/components/ui/modal-form";
import type { AnnouncementData } from "./announcement-page-client";

interface AnnouncementFormProps {
  onClose: () => void;
  existingAnnouncement?: AnnouncementData;
}

export function AnnouncementForm({ onClose, existingAnnouncement }: AnnouncementFormProps) {
  const { condominiumId } = useCondominium();
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
      ? await updateAnnouncement(condominiumId, existingAnnouncement.id, data)
      : await createAnnouncement(condominiumId, data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <ModalForm
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title={isEditing ? "Editar aviso" : "Novo aviso"}
      error={error}
      isSubmitting={isSubmitting}
      submitText={isEditing ? "Guardar alterações" : "Publicar aviso"}
      loadingText="A guardar..."
    >
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
    </ModalForm>
  );
}
