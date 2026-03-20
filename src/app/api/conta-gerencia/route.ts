import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { buildContaGerencia } from "@/lib/conta-gerencia";
import { generateContaGerencia } from "@/lib/pdf/conta-gerencia";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const yearParam = request.nextUrl.searchParams.get("year");
  if (!yearParam) {
    return NextResponse.json({ error: "Ano é obrigatório" }, { status: 400 });
  }
  const year = parseInt(yearParam, 10);

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;
  if (!condominiumId) {
    return NextResponse.json({ error: "Nenhum condomínio selecionado" }, { status: 400 });
  }

  // Verify membership (admin only)
  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId,
      },
    },
    include: { condominium: true },
  });

  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const condo = membership.condominium;

  // Fetch budget for the year
  const budget = await db.budget.findUnique({
    where: { condominiumId_year: { condominiumId, year } },
    include: { items: true },
  });

  // Fetch all quotas for the year
  const quotas = await db.quota.findMany({
    where: {
      condominiumId,
      period: { startsWith: `${year}-` },
    },
    include: {
      unit: {
        select: {
          identifier: true,
          owner: { select: { name: true } },
        },
      },
    },
  });

  // Fetch all expenses for the year
  const expenses = await db.expense.findMany({
    where: {
      condominiumId,
      date: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });

  const report = buildContaGerencia({
    year,
    condominiumName: condo.name,
    condominiumNif: condo.nif,
    condominiumAddress: [condo.address, condo.postalCode, condo.city].filter(Boolean).join(", "),

    budget: budget
      ? {
          totalAmount: Number(budget.totalAmount),
          status: budget.status,
          reserveFundPercentage: Number(budget.reserveFundPercentage),
          items: budget.items.map((i) => ({
            category: i.category,
            description: i.description,
            plannedAmount: Number(i.plannedAmount),
          })),
        }
      : null,

    quotas: quotas.map((q) => ({
      unitIdentifier: q.unit.identifier,
      ownerName: q.unit.owner?.name ?? null,
      amount: Number(q.amount),
      status: q.status as "PENDING" | "PAID" | "OVERDUE",
      period: q.period,
    })),

    expenses: expenses.map((e) => ({
      category: e.category,
      amount: Number(e.amount),
      date: e.date.toISOString().slice(0, 10),
    })),
  });

  const pdfBytes = generateContaGerencia(report);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="conta-gerencia-${year}.pdf"`,
    },
  });
}
