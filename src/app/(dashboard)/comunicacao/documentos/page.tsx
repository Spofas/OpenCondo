import { FileText, Upload } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Arquivo de documentos do condomínio
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Upload size={16} />
          Carregar documento
        </button>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {["Todos", "Atas", "Orçamentos", "Seguros", "Contratos", "Regulamentos"].map(
          (cat) => (
            <button
              key={cat}
              className="whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary transition-colors first:bg-primary first:text-primary-foreground first:border-primary"
            >
              {cat}
            </button>
          )
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileText size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhum documento carregado</p>
          <p className="text-xs">Carregue documentos para os partilhar com os condóminos</p>
        </div>
      </div>
    </div>
  );
}
