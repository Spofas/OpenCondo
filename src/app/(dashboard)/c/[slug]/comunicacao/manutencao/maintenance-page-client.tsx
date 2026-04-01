"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { MaintenanceList } from "./maintenance-list";
const MaintenanceForm = dynamic(() => import("./maintenance-form").then(m => m.MaintenanceForm));

export interface MaintenanceData {
  id: string;
  title: string;
  description: string;
  location: string | null;
  priority: string;
  status: string;
  requesterName: string;
  createdAt: string;
  updatedAt: string;
}

export function MaintenancePageClient({
  requests,
  isAdmin,
  page = 1,
  totalPages = 1,
  totalRequests = 0,
}: {
  requests: MaintenanceData[];
  isAdmin: boolean;
  page?: number;
  totalPages?: number;
  totalRequests?: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manutenção</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos de manutenção e reparação
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Novo pedido
        </button>
      </div>

      <MaintenanceList requests={requests} isAdmin={isAdmin} />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {totalRequests} pedido{totalRequests !== 1 ? "s" : ""} · Página {page} de {totalPages}
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

      {showForm && <MaintenanceForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
