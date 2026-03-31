import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import {
  AlertTriangle,
  AlertCircle,
  Wrench,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Receipt,
  Megaphone,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
} from "lucide-react";
import Link from "next/link";

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

type UrgencyLevel = "error" | "warning" | "info";

type AttentionItem = {
  id: string;
  level: UrgencyLevel;
  icon: React.ElementType;
  message: string;
  href: string;
  cta: string;
};

const urgencyStyles: Record<UrgencyLevel, { card: string; iconBg: string; cta: string }> = {
  error: {
    card: "bg-red-50 border-red-200",
    iconBg: "bg-red-100 text-red-600",
    cta: "text-red-600 hover:text-red-700",
  },
  warning: {
    card: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
    cta: "text-amber-600 hover:text-amber-700",
  },
  info: {
    card: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
    cta: "text-blue-600 hover:text-blue-700",
  },
};

function AttentionCard({ item }: { item: AttentionItem }) {
  const s = urgencyStyles[item.level];
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-4 rounded-xl border p-4 transition-opacity hover:opacity-80 ${s.card}`}
    >
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}>
        <Icon size={18} />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">{item.message}</span>
      <div className={`flex flex-shrink-0 items-center gap-1 text-xs font-medium ${s.cta}`}>
        {item.cta}
        <ArrowRight size={13} />
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon size={15} className={iconColor} />
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function QuickActionButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Icon size={15} className="text-muted-foreground" />
      {label}
    </Link>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
      </div>
      <div className="h-6 w-24 rounded bg-muted" />
      <div className="mt-1.5 h-3 w-20 rounded bg-muted" />
    </div>
  );
}

function AttentionSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-4 animate-pulse">
          <div className="h-9 w-9 rounded-lg bg-muted" />
          <div className="flex-1 h-4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

async function AdminDashboardContent({
  condoId,
  userId,
}: {
  condoId: string;
  userId: string;
}) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Mark overdue quotas
  await db.quota.updateMany({
    where: { condominiumId: condoId, status: "PENDING", dueDate: { lt: now }, deletedAt: null },
    data: { status: "OVERDUE" },
  });

  const [
    overdueQuotas,
    openMaintenanceCount,
    nextMeeting,
    expiringContracts,
    unitCount,
    currentPeriodQuotaCount,
    receitas,
    despesas,
  ] = await Promise.all([
    db.quota.aggregate({
      where: { condominiumId: condoId, status: "OVERDUE", deletedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
    db.maintenanceRequest.count({
      where: { condominiumId: condoId, status: { in: ["SUBMETIDO", "EM_ANALISE", "EM_CURSO"] } },
    }),
    db.meeting.findFirst({
      where: { condominiumId: condoId, status: "AGENDADA", date: { gte: now } },
      orderBy: { date: "asc" },
      select: { date: true, type: true },
    }),
    db.contract.findMany({
      where: { condominiumId: condoId, status: "ATIVO", endDate: { gte: now, lte: in30Days } },
      select: { id: true, type: true, endDate: true },
      orderBy: { endDate: "asc" },
    }),
    db.unit.count({ where: { condominiumId: condoId } }),
    db.quota.count({ where: { condominiumId: condoId, period: currentPeriod, deletedAt: null } }),
    db.transaction.aggregate({
      where: { condominiumId: condoId, type: "QUOTA_PAYMENT", deletedAt: null, date: { gte: yearStart } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { condominiumId: condoId, type: "EXPENSE", deletedAt: null, date: { gte: yearStart } },
      _sum: { amount: true },
    }),
  ]);

  const receitasAmount = Number(receitas._sum.amount ?? 0);
  const despesasAmount = Math.abs(Number(despesas._sum.amount ?? 0));
  const saldo = receitasAmount - despesasAmount;
  const overdueAmount = Number(overdueQuotas._sum.amount ?? 0);
  const year = now.getFullYear();

  const statCards = [
    {
      label: `Saldo ${year}`,
      value: formatCurrency(saldo),
      icon: Wallet,
      iconColor: saldo >= 0 ? "text-green-500" : "text-red-500",
      sub: "receitas − despesas",
    },
    {
      label: `Receitas ${year}`,
      value: formatCurrency(receitasAmount),
      icon: TrendingUp,
      iconColor: "text-green-500",
      sub: "quotas pagas",
    },
    {
      label: `Despesas ${year}`,
      value: formatCurrency(despesasAmount),
      icon: TrendingDown,
      iconColor: "text-orange-500",
      sub: "despesas registadas",
    },
    {
      label: "Próxima assembleia",
      value: nextMeeting
        ? nextMeeting.date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })
        : "—",
      icon: Calendar,
      iconColor: "text-blue-500",
      sub: nextMeeting
        ? nextMeeting.type === "ORDINARIA" ? "Ordinária" : "Extraordinária"
        : "nenhuma agendada",
    },
  ];

  const attentionItems: AttentionItem[] = [];

  if (overdueQuotas._count > 0) {
    attentionItems.push({
      id: "overdue-quotas",
      level: "error",
      icon: AlertTriangle,
      message: `${overdueQuotas._count} quota${overdueQuotas._count !== 1 ? "s" : ""} em atraso · ${formatCurrency(overdueAmount)}`,
      href: "/financas/quotas",
      cta: "Registar pagamento",
    });
  }

  if (openMaintenanceCount > 0) {
    attentionItems.push({
      id: "open-maintenance",
      level: "warning",
      icon: Wrench,
      message: `${openMaintenanceCount} pedido${openMaintenanceCount !== 1 ? "s" : ""} de manutenção em aberto`,
      href: "/comunicacao/manutencao",
      cta: "Ver pedidos",
    });
  }

  for (const contract of expiringContracts) {
    const daysLeft = Math.ceil((contract.endDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const when =
      daysLeft <= 7
        ? `em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}`
        : `a ${contract.endDate!.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}`;
    attentionItems.push({
      id: `contract-${contract.id}`,
      level: "warning",
      icon: FileText,
      message: `Contrato de ${contract.type} expira ${when}`,
      href: "/contratos",
      cta: "Ver contrato",
    });
  }

  if (unitCount > 0 && currentPeriodQuotaCount === 0) {
    const monthName = now.toLocaleDateString("pt-PT", { month: "long" });
    attentionItems.push({
      id: "quotas-not-generated",
      level: "warning",
      icon: AlertCircle,
      message: `Quotas de ${monthName} ainda não geradas`,
      href: "/financas/quotas",
      cta: "Gerar quotas",
    });
  }

  return (
    <>
      <section className="mb-8">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Precisa de atenção
        </h2>
        {attentionItems.length > 0 ? (
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <AttentionCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-sm text-muted-foreground">
              Sem pendências. Tudo em ordem.
            </span>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Acções rápidas
        </h2>
        <div className="flex flex-wrap gap-2">
          <QuickActionButton href="/financas/quotas" icon={CreditCard} label="Registar pagamento" />
          <QuickActionButton href="/financas/despesas" icon={Receipt} label="Nova despesa" />
          <QuickActionButton href="/comunicacao/avisos" icon={Megaphone} label="Criar aviso" />
        </div>
      </section>
    </>
  );
}

async function MemberDashboardContent({
  condoId,
  userId,
}: {
  condoId: string;
  userId: string;
}) {
  const now = new Date();

  // Mark overdue quotas
  await db.quota.updateMany({
    where: { condominiumId: condoId, status: "PENDING", dueDate: { lt: now }, deletedAt: null },
    data: { status: "OVERDUE" },
  });

  const myUnits = await db.unit.findMany({
    where: {
      condominiumId: condoId,
      OR: [{ ownerId: userId }, { tenantId: userId }],
    },
    select: { id: true },
  });
  const myUnitIds = myUnits.map((u) => u.id);

  const [overdueQuotas, pendingQuotas, nextMeeting, nextDueQuota] = await Promise.all([
    db.quota.aggregate({
      where: { condominiumId: condoId, unitId: { in: myUnitIds }, status: "OVERDUE", deletedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
    db.quota.aggregate({
      where: { condominiumId: condoId, unitId: { in: myUnitIds }, status: "PENDING", deletedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
    db.meeting.findFirst({
      where: { condominiumId: condoId, status: "AGENDADA", date: { gte: now } },
      orderBy: { date: "asc" },
      select: { date: true, type: true },
    }),
    db.quota.findFirst({
      where: { condominiumId: condoId, unitId: { in: myUnitIds }, status: "PENDING", deletedAt: null },
      orderBy: { dueDate: "asc" },
      select: { amount: true, dueDate: true },
    }),
  ]);

  const overdueAmount = Number(overdueQuotas._sum.amount ?? 0);

  const statCards = [
    {
      label: "Próxima quota",
      value: nextDueQuota ? formatCurrency(Number(nextDueQuota.amount)) : "—",
      icon: Clock,
      iconColor: "text-blue-500",
      sub: nextDueQuota
        ? `vence ${nextDueQuota.dueDate.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}`
        : "sem quotas pendentes",
    },
    {
      label: "Próxima assembleia",
      value: nextMeeting
        ? nextMeeting.date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })
        : "—",
      icon: Calendar,
      iconColor: "text-blue-500",
      sub: nextMeeting
        ? nextMeeting.type === "ORDINARIA" ? "Ordinária" : "Extraordinária"
        : "nenhuma agendada",
    },
  ];

  const attentionItems: AttentionItem[] = [];

  if (overdueQuotas._count > 0) {
    attentionItems.push({
      id: "my-overdue",
      level: "error",
      icon: AlertTriangle,
      message: `${overdueQuotas._count} quota${overdueQuotas._count !== 1 ? "s" : ""} em atraso · ${formatCurrency(overdueAmount)}`,
      href: "/financas/quotas",
      cta: "Ver quotas",
    });
  }

  if (pendingQuotas._count > 0) {
    const amount = Number(pendingQuotas._sum.amount ?? 0);
    attentionItems.push({
      id: "my-pending",
      level: "warning",
      icon: AlertCircle,
      message: `${pendingQuotas._count} quota${pendingQuotas._count !== 1 ? "s" : ""} pendente${pendingQuotas._count !== 1 ? "s" : ""} · ${formatCurrency(amount)}`,
      href: "/financas/quotas",
      cta: "Ver quotas",
    });
  }

  return (
    <>
      <section className="mb-8">
        <div className="grid gap-3 grid-cols-2">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Precisa de atenção
        </h2>
        {attentionItems.length > 0 ? (
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <AttentionCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-sm text-muted-foreground">
              Está em dia. Sem quotas em atraso.
            </span>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Acções rápidas
        </h2>
        <div className="flex flex-wrap gap-2">
          <QuickActionButton
            href="/comunicacao/manutencao"
            icon={ClipboardList}
            label="Submeter pedido de manutenção"
          />
        </div>
      </section>
    </>
  );
}

function DashboardSkeleton({ isAdmin }: { isAdmin: boolean }) {
  return (
    <>
      <section className="mb-8">
        <div className={`grid gap-3 ${isAdmin ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
          {Array.from({ length: isAdmin ? 4 : 2 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Precisa de atenção
        </h2>
        <AttentionSkeleton />
      </section>
    </>
  );
}

export default async function DashboardPage() {
  const { session, membership } = await requireMembership();

  const condoId = membership.condominiumId;
  const isAdmin = membership.role === "ADMIN";
  const firstName = session.user.name?.split(" ")[0] ?? session.user.name;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-muted-foreground">Bem-vindo, {firstName}</p>
      </div>

      <Suspense fallback={<DashboardSkeleton isAdmin={isAdmin} />}>
        {isAdmin ? (
          <AdminDashboardContent condoId={condoId} userId={session.user.id!} />
        ) : (
          <MemberDashboardContent condoId={condoId} userId={session.user.id!} />
        )}
      </Suspense>
    </div>
  );
}
