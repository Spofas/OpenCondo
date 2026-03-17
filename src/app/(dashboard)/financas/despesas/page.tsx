import { Receipt, Plus } from "lucide-react";

export default function ExpensesPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despesas</h1>
          <p className="text-sm text-muted-foreground">
            Registo e acompanhamento de despesas
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus size={16} />
          Registar despesa
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Receipt size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhuma despesa registada</p>
          <p className="text-xs">Registe as despesas do condomínio para acompanhar os gastos</p>
        </div>
      </div>
    </div>
  );
}
