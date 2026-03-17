import { Wallet, AlertTriangle, Wrench, Users } from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-card-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-muted-foreground">Bem-vindo ao OpenCondo</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Quotas pendentes"
          value="€0"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Quotas em atraso"
          value="0"
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={Wrench}
          label="Pedidos em aberto"
          value="0"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={Users}
          label="Próxima assembleia"
          value="—"
          color="bg-green-100 text-green-600"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Announcements */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            Avisos recentes
          </h2>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Sem avisos recentes
          </div>
        </div>

        {/* Financial Summary */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            Resumo financeiro
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Receitas (quotas)</span>
              <span className="font-medium text-card-foreground">€0,00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Despesas</span>
              <span className="font-medium text-card-foreground">€0,00</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Saldo</span>
                <span>€0,00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
