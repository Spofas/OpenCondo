import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Definições</h1>
        <p className="text-sm text-muted-foreground">
          Configurações do condomínio e conta
        </p>
      </div>

      <div className="grid gap-6">
        {/* Condominium Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            Dados do condomínio
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Nome
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Nome do condomínio"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  NIF
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="123456789"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Morada
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Morada do edifício"
              />
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">
              Membros
            </h2>
            <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Convidar membro
            </button>
          </div>
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            <Settings size={20} className="mr-2" />
            Configure os membros do condomínio
          </div>
        </div>
      </div>
    </div>
  );
}
