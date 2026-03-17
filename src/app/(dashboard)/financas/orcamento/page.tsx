import { PieChart, Plus } from "lucide-react";

export default function BudgetPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamento</h1>
          <p className="text-sm text-muted-foreground">
            Orçamento anual e fundo de reserva
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus size={16} />
          Novo orçamento
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <PieChart size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhum orçamento criado</p>
          <p className="text-xs">Crie o orçamento anual para calcular as quotas</p>
        </div>
      </div>
    </div>
  );
}
