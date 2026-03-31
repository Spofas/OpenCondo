import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { CalendarClient, type CalendarEvent } from "./calendar-client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function CalendarPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);
  const searchP = await searchParams;

  const condoId = membership.condominiumId;
  const now = new Date();

  // Parse month/year from search params, default to current
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();
  const selectedMonth = searchP.month
    ? Math.max(0, Math.min(11, parseInt(searchP.month, 10) - 1))
    : currentMonth;
  const selectedYear = searchP.year
    ? parseInt(searchP.year, 10)
    : currentYear;

  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear + 1, 0, 1);

  // Fetch events in parallel
  const [meetings, quotaDueDates, contracts] = await Promise.all([
    // Meetings
    db.meeting.findMany({
      where: {
        condominiumId: condoId,
        date: { gte: yearStart, lt: yearEnd },
      },
      select: { id: true, date: true, type: true, status: true, location: true },
      orderBy: { date: "asc" },
    }),
    // Unique quota due dates
    db.quota.findMany({
      where: {
        condominiumId: condoId,
        dueDate: { gte: yearStart, lt: yearEnd },
      },
      select: { dueDate: true, status: true },
    }),
    // Contracts with end dates
    db.contract.findMany({
      where: {
        condominiumId: condoId,
        status: "ATIVO",
        endDate: { gte: yearStart, lt: yearEnd },
      },
      select: { id: true, endDate: true, type: true, description: true },
    }),
  ]);

  const events: CalendarEvent[] = [];

  // Meeting events
  for (const m of meetings) {
    events.push({
      date: m.date.toISOString().slice(0, 10),
      type: "meeting",
      label: `Assembleia ${m.type === "ORDINARIA" ? "Ordinária" : "Extraordinária"}`,
      detail: m.location,
      status: m.status === "CANCELADA" ? "cancelled" : m.status === "REALIZADA" ? "done" : "upcoming",
    });
  }

  // Quota due dates (group by date, count)
  const quotaByDate = new Map<string, { total: number; overdue: number }>();
  for (const q of quotaDueDates) {
    const dateStr = q.dueDate.toISOString().slice(0, 10);
    const entry = quotaByDate.get(dateStr) || { total: 0, overdue: 0 };
    entry.total++;
    if (q.status === "OVERDUE") entry.overdue++;
    quotaByDate.set(dateStr, entry);
  }
  for (const [date, counts] of quotaByDate.entries()) {
    events.push({
      date,
      type: "quota",
      label: `${counts.total} quotas vencem`,
      detail: counts.overdue > 0 ? `${counts.overdue} em atraso` : null,
      status: counts.overdue > 0 ? "overdue" : "upcoming",
    });
  }

  // Contract renewals
  for (const c of contracts) {
    if (!c.endDate) continue;
    events.push({
      date: c.endDate.toISOString().slice(0, 10),
      type: "contract",
      label: `Contrato: ${c.type}`,
      detail: c.description,
      status: "upcoming",
    });
  }

  return <CalendarClient events={events} initialMonth={selectedMonth} initialYear={selectedYear} />;
}
