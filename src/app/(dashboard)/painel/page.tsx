import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import {
  Wallet,
  AlertTriangle,
  Wrench,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
        >
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-card-foreground">{value}</p>
        </div>
        {href && (
          <ArrowRight size={16} className="text-muted-foreground" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-transform hover:scale-[1.02]">
        {content}
      </Link>
    );
  }

  return content;
}

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

  const condoId = membership.condominiumId;
  const isAdmin = membership.role === "ADMIN";
  const now = new Date();

  // Mark overdue quotas
  await db.quota.updateMany({
    where: { condominiumId: condoId, status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  // For non-admin: find their unit IDs
  let myUnitIds: string[] = [];
  if (!isAdmin) {
    const myUnits = await db.unit.findMany({
      where: {
        condominiumId: condoId,
        OR: [{ ownerId: session.user.id }, { tenantId: session.user.id }],
      },
      select: { id: true },
    });
    myUnitIds = myUnits.map((u) => u.id);
  }

  const quotaFilter = isAdmin
    ? { condominiumId: condoId }
    : { condominiumId: condoId, unitId: { in: myUnitIds } };

  // Fetch data — admins see full condo stats; non-admins see their own
  const [
    pendingQuotas,
    overdueQuotas,
    paidQuotas,
    expenses,
    recentQuotas,
    openMaintenanceCount,
    nextMeeting,
    recentAnnouncements,
    latestBudget,
  ] = await Promise.all([
    db.quota.aggregate({ where: { ...quotaFilter, status: "PENDING" }, _sum: { amount: true }, _count: true }),
    db.quota.aggregate({ where: { ...quotaFilter, status: "OVERDUE" }, _sum: { amount: true }, _count: true }),
    db.quota.aggregate({ where: { ...quotaFilter, status: "PAID" }, _sum: { amount: true }, _count: true }),
    // Expenses are condo-wide and admin-only
    isAdmin
      ? db.expense.aggregate({ where: { condominiumId: condoId }, _sum: { amount: true }, _count: true })
      : Promise.resolve({ _sum: { amount: null }, _count: 0 }),
    // Recent payments (own for non-admin)
    db.quota.findMany({
      where: { ...quotaFilter, status: "PAID" },
      include: { unit: { select: { identifier: true } } },
      orderBy: { paymentDate: "desc" },
      take: 5,
    }),
    db.maintenanceRequest.count({
      where: { condominiumId: condoId, status: { in: ["SUBMETIDO", "EM_ANALISE", "EM_CURSO"] } },
    }),
    db.meeting.findFirst({
      where: { condominiumId: condoId, status: "AGENDADA", date: { gte: now } },
      orderBy: { date: "asc" },
    }),
    db.announcement.findMany({
      where: { condominiumId: condoId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    isAdmin
      ? db.budget.findFirst({
          where: { condominiumId: condoId, status: "APPROVED" },
          orderBy: { year: "desc" },
          select: { reserveFundPercentage: true },
        })
      : Promise.resolve(null),
  ]);

  const pendingAmount = Number(pendingQuotas._sum.amount ?? 0);
  const overdueAmount = Number(overdueQuotas._sum.amount ?? 0);
  const paidAmount = Number(paidQuotas._sum.amount ?? 0);
  const expenseAmount = Number(expenses._sum.amount ?? 0);
  const balance = paidAmount - expenseAmount;
  const reservePercentage = latestBudget ? Number(latestBudget.reserveFundPercentage) : 10;
  const reserveFundBalance = Math.round(paidAmount * (reservePercentage / 100) * 100) / 100;

  const pendingLabel = isAdmin ? "Quotas pendentes" : "Minhas quotas pendentes";
  const overdueLabel = isAdmin ? "Quotas em atraso" : "Minhas quotas em atraso";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-muted-foreground">Bem-vindo, {session.user.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label={pendingLabel}
          value={formatCurrency(pendingAmount)}
          color="bg-blue-100 text-blue-600"
          href="/financas/quotas"
        />
        <StatCard
          icon={AlertTriangle}
          label={overdueLabel}
          value={
            overdueQuotas._count > 0
              ? `${overdueQuotas._count} (${formatCurrency(overdueAmount)})`
              : "0"
          }
          color={overdueQuotas._count > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}
          href="/financas/quotas"
        />
        <StatCard
          icon={Wrench}
          label="Pedidos em aberto"
          value={String(openMaintenanceCount)}
          color="bg-purple-100 text-purple-600"
          href="/comunicacao/manutencao"
        />
        <StatCard
          icon={Users}
          label="Próxima assembleia"
          value={
            nextMeeting
              ? new Date(nextMeeting.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })
              : "—"
          }
          color="bg-green-100 text-green-600"
          href="/assembleia/reunioes"
        />
      </div>

      {/* Recent announcements */}
      {recentAnnouncements.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <Megaphone size={18} />
              Avisos recentes
            </h2>
            <Link href="/comunicacao/avisos" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{a.title}</h3>
                  {a.pinned && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      Fixo
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {a.author.name} — {new Date(a.createdAt).toLocaleDateString("pt-PT")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">
              {isAdmin ? "Últimos pagamentos" : "Os meus pagamentos"}
            </h2>
            {recentQuotas.length > 0 && (
              <Link href="/financas/quotas" className="text-xs text-primary hover:underline">
                Ver todos
              </Link>
            )}
          </div>
          {recentQuotas.length > 0 ? (
            <div className="space-y-3">
              {recentQuotas.map((q) => (
                <div key={q.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-foreground">{q.unit.identifier}</span>
                    <span className="ml-2 text-muted-foreground">{q.period}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-green-600">{formatCurrency(Number(q.amount))}</span>
                    {q.paymentDate && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(q.paymentDate).toLocaleDateString("pt-PT")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Sem pagamentos registados
            </div>
          )}
        </div>

        {/* Financial Summary — full for admin, simplified for others */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            {isAdmin ? "Resumo financeiro" : "As minhas quotas"}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp size={14} className="text-green-500" />
                {isAdmin ? "Receitas (quotas pagas)" : "Pagas"}
              </div>
              <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingDown size={14} className="text-red-500" />
                  Despesas
                </div>
                <span className="font-medium text-red-600">{formatCurrency(expenseAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{isAdmin ? "Por receber (pendente + atraso)" : "Pendentes"}</span>
              <span className="font-medium text-amber-600">{formatCurrency(pendingAmount)}</span>
            </div>
            {overdueAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Em atraso</span>
                <span className="font-medium text-red-600">{formatCurrency(overdueAmount)}</span>
              </div>
            )}
            {isAdmin && (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Fundo de reserva ({reservePercentage}%)</span>
                  <span className="font-medium text-blue-600">{formatCurrency(reserveFundBalance)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Saldo</span>
                    <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
