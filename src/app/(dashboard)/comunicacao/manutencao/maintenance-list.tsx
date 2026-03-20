"use client";

import { useState } from "react";
import { Wrench, Trash2 } from "lucide-react";
import { updateMaintenanceStatus, deleteMaintenanceRequest } from "./actions";
import { PRIORITY_LABELS, STATUS_LABELS, MAINTENANCE_STATUSES } from "@/lib/validators/maintenance";
import type { MaintenanceData } from "./maintenance-page-client";

const PRIORITY_COLORS: Record<string, string> = {
  BAIXA: "bg-green-100 text-green-700",
  MEDIA: "bg-yellow-100 text-yellow-700",
  ALTA: "bg-orange-100 text-orange-700",
  URGENTE: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  SUBMETIDO: "bg-blue-100 text-blue-700",
  EM_ANALISE: "bg-yellow-100 text-yellow-700",
  EM_CURSO: "bg-orange-100 text-orange-700",
  CONCLUIDO: "bg-green-100 text-green-700",
};

export function MaintenanceList({
  requests,
  isAdmin,
}: {
  requests: MaintenanceData[];
  isAdmin: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  async function handleStatusChange(requestId: string, newStatus: string) {
    setActionError("");
    const result = await updateMaintenanceStatus(requestId, { status: newStatus });
    if (result.error) setActionError(result.error);
  }

  async function handleDelete(id: string) {
    setActionError("");
    const result = await deleteMaintenanceRequest(id);
    if (result.error) setActionError(result.error);
    setConfirmDelete(null);
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Wrench size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhum pedido de manutenção</p>
          <p className="text-xs">Os pedidos de manutenção submetidos aparecem aqui</p>
        </div>
      </div>
    );
  }

  // Summary counts
  const statusCounts = new Map<string, number>();
  for (const r of requests) {
    statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1);
  }

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Status summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MAINTENANCE_STATUSES.map((status) => (
          <div key={status} className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {statusCounts.get(status) || 0}
            </div>
            <div className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</div>
          </div>
        ))}
      </div>

      {/* Request cards */}
      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-foreground">
                    {request.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      PRIORITY_COLORS[request.priority] || "bg-muted text-foreground"
                    }`}
                  >
                    {PRIORITY_LABELS[request.priority]}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[request.status] || "bg-muted text-foreground"
                    }`}
                  >
                    {STATUS_LABELS[request.status]}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground/80">
                  {request.description}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{request.requesterName}</span>
                  {request.location && <span>{request.location}</span>}
                  <span>
                    {new Date(request.createdAt).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {request.status !== "CONCLUIDO" && (
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                    >
                      {MAINTENANCE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  )}
                  {confirmDelete === request.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-white hover:bg-destructive/90"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(request.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Eliminar"
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
