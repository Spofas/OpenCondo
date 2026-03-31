import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateBudgetPdf } from "@/lib/pdf/budget";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ budgetId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { budgetId } = await params;

  const budget = await db.budget.findUnique({
    where: { id: budgetId },
    include: {
      items: {
        orderBy: { category: "asc" },
      },
      condominium: {
        select: { id: true, name: true, address: true, city: true, nif: true },
      },
    },
  });

  if (!budget) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  // Check user has access to this condominium
  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: budget.condominiumId,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const condo = budget.condominium;
  const address = [condo.address, condo.city].filter(Boolean).join(", ");

  const pdfBytes = generateBudgetPdf({
    year: budget.year,
    status: budget.status,
    approvedAt: budget.approvedAt ? budget.approvedAt.toISOString() : null,
    totalAmount: Number(budget.totalAmount),
    reserveFundPercentage: Number(budget.reserveFundPercentage),
    condominiumName: condo.name,
    condominiumAddress: address,
    condominiumNif: condo.nif,
    items: budget.items.map((item) => ({
      category: item.category,
      description: item.description,
      plannedAmount: Number(item.plannedAmount),
    })),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${budget.year}.pdf"`,
    },
  });
}
