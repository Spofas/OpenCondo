"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  openingBalanceSchema,
  adjustmentSchema,
  type OpeningBalanceInput,
  type AdjustmentInput,
} from "@/lib/validators/ledger";
import { setOpeningBalance, addAdjustment, deleteAdjustment } from "./actions";

interface LedgerEntryRow {
  id: string;
  date: string;
  amount: number;
  type: string;
  description: string;
  quotaId: string | null;
  expenseId: string | null;
}

interface Props {
  currentBalance: number;
  openingBalance: number;
  entries: LedgerEntryRow[];
  hasOpeningBalance: boolean;
  from: string;
  to: string;
}

const TYPE_LABELS: Record<string, string> = {
  OPENING_BALANCE: "Saldo inicial",
  QUOTA_PAYMENT: "Pagamento de quota",
  EXPENSE: "Despesa",
  ADJUSTMENT: "Ajuste",
};

const TYPE_COLORS: Record<string, string> = {
  OPENING_BALANCE: "bg-blue-100 text-blue-700",
  QUOTA_PAYMENT: "bg-green-100 text-green-700",
  EXPENSE: "bg-red-100 text-red-700",
  ADJUSTMENT: "bg-yellow-100 text-yellow-700",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT");
}

export function LivroCaixaPageClient({
  currentBalance,
  openingBalance,
  entries,
  hasOpeningBalance,
  from,
  to,
}: Props) {
  const router = useRouter();
  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterFrom, setFilterFrom] = useState(from);
  const [filterTo, setFilterTo] = useState(to);

  // Opening balance form
  const openingForm = useForm<OpeningBalanceInput>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: { amount: 0, date: from, description: "" },
  });

  // Adjustment form
  const adjForm = useForm<AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { amount: 0, date: new Date().toISOString().split("T")[0], description: "" },
  });

  async function handleSetOpeningBalance(data: OpeningBalanceInput) {
    const result = await setOpeningBalance(data);
    if (result.error) {
      openingForm.setError("root", { message: result.error });
      return;
    }
    setShowOpeningForm(false);
    openingForm.reset();
    router.refresh();
  }

  async function handleAddAdjustment(data: AdjustmentInput) {
    const result = await addAdjustment(data);
    if (result.error) {
      adjForm.setError("root", { message: result.error });
      return;
    }
    setShowAdjustmentForm(false);
    adjForm.reset();
    router.refresh();
  }

  async function handleDeleteAdjustment(id: string) {
    const result = await deleteAdjustment(id);
    if (!result.error) {
      setDeletingId(null);
      router.refresh();
    }
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/financas/livro-caixa?from=${filterFrom}&to=${filterTo}`);
  }

  // Compute running balance rows
  let running = openingBalance;
  const rows = entries.map((e) => {
    running += e.amount;
    return { ...e, runningBalance: running };
  });
  const closingBalance = running;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Livro de caixa</h1>
          <p className="text-sm text-muted-foreground">
            Registo cronológico de todas as entradas e saídas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowOpeningForm(true)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            {hasOpeningBalance ? "Editar saldo inicial" : "Definir saldo inicial"}
          </button>
          <button
            onClick={() => setShowAdjustmentForm(true)}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Ajuste manual
          </button>
        </div>
      </div>

      {/* Current balance card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">Saldo atual</p>
        <p
          className={`mt-1 text-3xl font-bold ${
            currentBalance >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatCurrency(currentBalance)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Soma de todos os movimentos registados
        </p>
      </div>

      {/* Date filter */}
      <form
        onSubmit={handleFilter}
        className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            De
          </label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Até
          </label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filtrar
        </button>
      </form>

      {/* Statement table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Opening balance row */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="font-medium text-muted-foreground">
            Saldo de abertura ({new Date(from).toLocaleDateString("pt-PT")})
          </span>
          <span
            className={`font-semibold ${
              openingBalance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(openingBalance)}
          </span>
        </div>

        {/* Column headers — desktop */}
        <div className="hidden md:grid grid-cols-[120px_1fr_150px_100px_120px] gap-4 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Data</span>
          <span>Descrição</span>
          <span>Tipo</span>
          <span className="text-right">Valor</span>
          <span className="text-right">Saldo</span>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Sem movimentos neste período
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="divide-y divide-border md:hidden">
              {rows.map((row) => (
                <div key={row.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(row.date)}
                      </span>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          TYPE_COLORS[row.type] ?? "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {TYPE_LABELS[row.type] ?? row.type}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium tabular-nums whitespace-nowrap ${
                        row.amount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {row.amount >= 0 ? "+" : ""}
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {row.description}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {formatCurrency(row.runningBalance)}
                      </span>
                      {row.type === "ADJUSTMENT" && (
                        <>
                          {deletingId === row.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDeleteAdjustment(row.id)}
                                className="rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-secondary"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(row.id)}
                              className="text-xs text-muted-foreground hover:text-red-600"
                            >
                              ×
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop grid view */}
            <div className="hidden md:block">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[120px_1fr_150px_100px_120px] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/20"
                >
                  <span className="text-muted-foreground">{formatDate(row.date)}</span>
                  <span className="truncate font-medium text-foreground">
                    {row.description}
                  </span>
                  <span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_COLORS[row.type] ?? "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {TYPE_LABELS[row.type] ?? row.type}
                    </span>
                  </span>
                  <span
                    className={`text-right font-medium tabular-nums ${
                      row.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {row.amount >= 0 ? "+" : ""}
                    {formatCurrency(row.amount)}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(row.runningBalance)}
                    </span>
                    {row.type === "ADJUSTMENT" && (
                      <>
                        {deletingId === row.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDeleteAdjustment(row.id)}
                              className="rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(row.id)}
                            className="text-xs text-muted-foreground hover:text-red-600"
                          >
                            ×
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Closing balance row */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="font-medium text-muted-foreground">
            Saldo de fecho ({new Date(to).toLocaleDateString("pt-PT")})
          </span>
          <span
            className={`font-bold ${
              closingBalance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(closingBalance)}
          </span>
        </div>
      </div>

      {/* Opening balance modal */}
      {showOpeningForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {hasOpeningBalance ? "Editar saldo inicial" : "Definir saldo inicial"}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Introduza o saldo bancário existente à data de início do registo.
              Este valor é o ponto de partida do livro de caixa.
            </p>
            <form
              onSubmit={openingForm.handleSubmit(handleSetOpeningBalance)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Data
                </label>
                <input
                  type="date"
                  {...openingForm.register("date")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                {openingForm.formState.errors.date && (
                  <p className="mt-1 text-xs text-red-600">
                    {openingForm.formState.errors.date.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Saldo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...openingForm.register("amount", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                {openingForm.formState.errors.amount && (
                  <p className="mt-1 text-xs text-red-600">
                    {openingForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Saldo inicial"
                  {...openingForm.register("description")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              {openingForm.formState.errors.root && (
                <p className="text-xs text-red-600">
                  {openingForm.formState.errors.root.message}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpeningForm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={openingForm.formState.isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {openingForm.formState.isSubmitting ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment modal */}
      {showAdjustmentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Ajuste manual
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Use valores positivos para entradas e negativos para saídas não
              registadas noutros módulos.
            </p>
            <form
              onSubmit={adjForm.handleSubmit(handleAddAdjustment)}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Data
                </label>
                <input
                  type="date"
                  {...adjForm.register("date")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                {adjForm.formState.errors.date && (
                  <p className="mt-1 text-xs text-red-600">
                    {adjForm.formState.errors.date.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Valor (€) — use negativo para saída
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...adjForm.register("amount", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                {adjForm.formState.errors.amount && (
                  <p className="mt-1 text-xs text-red-600">
                    {adjForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Correção de saldo"
                  {...adjForm.register("description")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                {adjForm.formState.errors.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {adjForm.formState.errors.description.message}
                  </p>
                )}
              </div>
              {adjForm.formState.errors.root && (
                <p className="text-xs text-red-600">
                  {adjForm.formState.errors.root.message}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentForm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adjForm.formState.isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {adjForm.formState.isSubmitting ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
