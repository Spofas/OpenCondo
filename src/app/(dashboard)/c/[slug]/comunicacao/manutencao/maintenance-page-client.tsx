"use client";

import { useState } from "react";
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
}: {
  requests: MaintenanceData[];
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

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

      {showForm && <MaintenanceForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
