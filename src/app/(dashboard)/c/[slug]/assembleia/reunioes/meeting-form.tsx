"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash2 } from "lucide-react";
import {
  meetingSchema,
  type MeetingInput,
  MEETING_TYPES,
  TYPE_LABELS,
} from "@/lib/validators/meeting";
import { createMeeting } from "./actions";
import { useCondominium } from "@/lib/condominium-context";

interface MeetingFormProps {
  onClose: () => void;
}

export function MeetingForm({ onClose }: MeetingFormProps) {
  const { condominiumId } = useCondominium();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MeetingInput>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      date: "",
      time: "19:00",
      location: "",
      type: "ORDINARIA",
      agendaItems: [{ title: "", description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "agendaItems",
  });

  async function onSubmit(data: MeetingInput) {
    setIsSubmitting(true);
    setError("");

    const result = await createMeeting(condominiumId, data);

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
            Agendar assembleia
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

          {/* Date, Time & Type */}
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Data
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Hora
              </label>
              <input
                type="time"
                {...register("time")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.time && (
                <p className="mt-1 text-xs text-destructive">{errors.time.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Tipo
              </label>
              <select
                {...register("type")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Local
            </label>
            <input
              type="text"
              placeholder="Ex: Sala de condomínio, Rés-do-chão"
              {...register("location")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.location && (
              <p className="mt-1 text-xs text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Agenda Items */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                Ordem de trabalhos
              </label>
              <button
                type="button"
                onClick={() => append({ title: "", description: "" })}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                <Plus size={12} />
                Adicionar ponto
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-2 flex-shrink-0 text-xs font-medium text-muted-foreground">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Título do ponto"
                        {...register(`agendaItems.${index}.title`)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      {errors.agendaItems?.[index]?.title && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.agendaItems[index].title?.message}
                        </p>
                      )}
                      <input
                        type="text"
                        placeholder="Descrição (opcional)"
                        {...register(`agendaItems.${index}.description`)}
                        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="mt-2 rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.agendaItems?.message && (
              <p className="mt-1 text-xs text-destructive">
                {errors.agendaItems.message}
              </p>
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
              {isSubmitting ? "A guardar..." : "Agendar assembleia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
