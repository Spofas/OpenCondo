import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAtaPdf } from "@/lib/pdf/ata";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ataId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { ataId } = await params;

  const ata = await db.ata.findUnique({
    where: { id: ataId },
    include: {
      meeting: {
        include: {
          condominium: {
            select: { id: true, name: true, address: true, city: true, nif: true },
          },
          agendaItems: {
            orderBy: { order: "asc" },
            select: { title: true, description: true },
          },
        },
      },
    },
  });

  if (!ata) {
    return NextResponse.json({ error: "Ata não encontrada" }, { status: 404 });
  }

  // Check user has access to this condominium
  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: ata.meeting.condominiumId,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const condo = ata.meeting.condominium;
  const address = [condo.address, condo.city].filter(Boolean).join(", ");

  const pdfBytes = generateAtaPdf({
    ataNumber: ata.number,
    status: ata.status,
    content: ata.content,
    meetingType: ata.meeting.type,
    meetingDate: ata.meeting.date.toISOString(),
    meetingLocation: ata.meeting.location,
    condominiumName: condo.name,
    condominiumAddress: address,
    condominiumNif: condo.nif,
    agendaItems: ata.meeting.agendaItems,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ata-${ata.number}.pdf"`,
    },
  });
}
