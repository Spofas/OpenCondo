"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { condominiumSchema, unitSchema } from "@/lib/validators/condominium";
import { createCondominiumWithUnits } from "./actions";

const fullSchema = condominiumSchema.extend({
  units: z.array(unitSchema).min(1, "Adicione pelo menos uma fração"),
});

type FormData = z.infer<typeof fullSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      name: "",
      address: "",
      postalCode: "",
      city: "",
      nif: "",
      quotaModel: "PERMILAGEM",
      units: [{ identifier: "", floor: undefined, typology: "", permilagem: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "units",
  });

  const quotaModel = watch("quotaModel");
  const units = watch("units");
  const totalPermilagem = units.reduce((sum, u) => sum + (Number(u.permilagem) || 0), 0);

  async function goToStep2() {
    const valid = await trigger(["name", "address", "postalCode", "city", "nif", "quotaModel"]);
    if (valid) setStep(2);
  }

  async function onSubmit(data: FormData) {
    setServerError("");
    setIsSubmitting(true);

    try {
      const { units: unitsList, ...condoData } = data;
      const result = await createCondominiumWithUnits(condoData, unitsList);

      if (result.error) {
        setServerError(result.error);
        setIsSubmitting(false);
        return;
      }

      window.location.href = "/painel";
    } catch (err) {
      console.error("Onboarding error:", err);
      setServerError("Erro inesperado. Verifique a consola do servidor.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Configurar o seu condomínio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1
              ? "Passo 1 de 2 — Dados do condomínio"
              : "Passo 2 de 2 — Frações do edifício"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-primary" />
          <div
            className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-primary" : "bg-border"}`}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            {/* Step 1: Condominium details */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Nome do condomínio *
                  </label>
                  <input
                    {...register("name")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Edifício Sol Nascente"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Morada *
                  </label>
                  <input
                    {...register("address")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Rua das Flores, 123"
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Código postal
                    </label>
                    <input
                      {...register("postalCode")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="1234-567"
                    />
                    {errors.postalCode && (
                      <p className="mt-1 text-xs text-red-500">{errors.postalCode.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Cidade
                    </label>
                    <input
                      {...register("city")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Lisboa"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    NIF do condomínio
                  </label>
                  <input
                    {...register("nif")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="123456789"
                  />
                  {errors.nif && (
                    <p className="mt-1 text-xs text-red-500">{errors.nif.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Modelo de quotas *
                  </label>
                  <select
                    {...register("quotaModel")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="PERMILAGEM">Permilagem (proporcional)</option>
                    <option value="EQUAL">Divisão igual</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {quotaModel === "PERMILAGEM"
                      ? "Cada fração paga proporcionalmente à sua permilagem (total = 1000‰)"
                      : "Todas as frações pagam o mesmo valor"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goToStep2}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Seguinte
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Units */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Frações
                  </h2>
                  {quotaModel === "PERMILAGEM" && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        totalPermilagem === 1000
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {totalPermilagem} / 1000‰
                    </span>
                  )}
                </div>

                {/* Units list */}
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border border-border bg-muted/50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          Fração {index + 1}
                        </span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="mb-1 block text-xs text-muted-foreground">
                            Identificação *
                          </label>
                          <input
                            {...register(`units.${index}.identifier`)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="1.º Esq"
                          />
                          {errors.units?.[index]?.identifier && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.units[index].identifier?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">
                            Piso
                          </label>
                          <input
                            type="number"
                            {...register(`units.${index}.floor`, {
                              setValueAs: (v) =>
                                v === "" || v === null || v === undefined ? undefined : parseInt(v, 10),
                            })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="0 = R/C"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">
                            Tipologia
                          </label>
                          <input
                            {...register(`units.${index}.typology`)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="T2"
                          />
                        </div>

                        {quotaModel === "PERMILAGEM" && (
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Permilagem (‰)
                            </label>
                            <input
                              type="number"
                              {...register(`units.${index}.permilagem`, {
                                valueAsNumber: true,
                              })}
                              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              placeholder="0"
                            />
                            {errors.units?.[index]?.permilagem && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors.units[index].permilagem?.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    append({ identifier: "", floor: undefined, typology: "", permilagem: 0 })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={16} />
                  Adicionar fração
                </button>

                {errors.units?.root && (
                  <p className="text-xs text-red-500">{errors.units.root.message}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "A criar..." : "Criar condomínio"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
