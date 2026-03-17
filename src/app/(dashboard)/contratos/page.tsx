import { FileSignature, Plus } from "lucide-react";

export default function ContractsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de contratos e seguros
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus size={16} />
          Novo contrato
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileSignature size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhum contrato registado</p>
          <p className="text-xs">Registe contratos de manutenção, seguros e outros serviços</p>
        </div>
      </div>
    </div>
  );
}
