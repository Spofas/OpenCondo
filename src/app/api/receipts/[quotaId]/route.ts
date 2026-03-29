import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateReceipt } from "@/lib/pdf/receipt";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quotaId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { quotaId } = await params;

  const quota = await db.quota.findUnique({
    where: { id: quotaId },
    include: {
      unit: {
        include: {
          owner: { select: { name: true } },
          condominium: {
            select: { name: true, nif: true, address: true, city: true },
          },
        },
      },
    },
  });

  if (!quota) {
    return NextResponse.json({ error: "Quota não encontrada" }, { status: 404 });
  }

  // Check user has access to this condominium
  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: quota.unit.condominiumId,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Non-admin users can only download receipts for their own units
  if (membership.role !== "ADMIN") {
    const ownUnit = await db.unit.findFirst({
      where: {
        id: quota.unitId,
        OR: [{ ownerId: session.user.id }, { tenantId: session.user.id }],
      },
      select: { id: true },
    });
    if (!ownUnit) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  if (quota.status !== "PAID" || !quota.paymentDate) {
    return NextResponse.json(
      { error: "Recibo disponível apenas para quotas pagas" },
      { status: 400 }
    );
  }

  const condo = quota.unit.condominium;
  const address = [condo.address, condo.city].filter(Boolean).join(", ");

  const pdfBytes = generateReceipt({
    condominiumName: condo.name,
    condominiumNif: condo.nif,
    condominiumAddress: address,
    unitIdentifier: quota.unit.identifier,
    ownerName: quota.unit.owner?.name || null,
    period: quota.period,
    amount: Number(quota.amount),
    dueDate: quota.dueDate.toISOString(),
    paymentDate: quota.paymentDate.toISOString(),
    paymentMethod: quota.paymentMethod || "outro",
    receiptNumber: `REC-${quota.period.replace("-", "")}-${quota.unit.identifier.replace(/[^a-zA-Z0-9]/g, "")}`,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${quota.period}-${quota.unit.identifier}.pdf"`,
    },
  });
}
