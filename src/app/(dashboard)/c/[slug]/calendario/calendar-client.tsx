"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Wallet,
  FileSignature,
} from "lucide-react";

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  type: "meeting" | "quota" | "contract";
  label: string;
  detail: string | null;
  status: "upcoming" | "done" | "cancelled" | "overdue";
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const EVENT_COLORS: Record<string, string> = {
  meeting: "bg-green-100 text-green-700 border-green-200",
  quota: "bg-blue-100 text-blue-700 border-blue-200",
  contract: "bg-orange-100 text-orange-700 border-orange-200",
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  meeting: Users,
  quota: Wallet,
  contract: FileSignature,
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0 = Monday ... 6 = Sunday
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface CalendarClientProps {
  events: CalendarEvent[];
  initialMonth: number; // 0-indexed
  initialYear: number;
}

export function CalendarClient({ events, initialMonth, initialYear }: CalendarClientProps) {
  const now = new Date();
  const router = useRouter();
  const pathname = usePathname();
  const month = initialMonth;
  const year = initialYear;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Group events by date
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = eventsByDate.get(event.date) || [];
    existing.push(event);
    eventsByDate.set(event.date, existing);
  }

  function navigateToMonth(newMonth: number, newYear: number) {
    router.push(`${pathname}?month=${newMonth + 1}&year=${newYear}`);
  }

  function prevMonth() {
    if (month === 0) {
      navigateToMonth(11, year - 1);
    } else {
      navigateToMonth(month - 1, year);
    }
  }

  function nextMonth() {
    if (month === 11) {
      navigateToMonth(0, year + 1);
    } else {
      navigateToMonth(month + 1, year);
    }
  }

  function goToday() {
    navigateToMonth(now.getMonth(), now.getFullYear());
  }

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
        <p className="text-sm text-muted-foreground">
          Assembleias, vencimentos e renovações de contratos
        </p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          Assembleias
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          Quotas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
          Contratos
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar grid */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {MONTH_NAMES[month]} {year}
              </h2>
              <button
                onClick={goToday}
                className="rounded-lg border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Hoje
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="pb-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-20" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsByDate.get(dateStr) || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className={`h-20 rounded-lg border p-1 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isToday
                        ? "border-primary/50 bg-primary/5"
                        : "border-transparent hover:bg-muted"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <span
                        key={j}
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          ev.type === "meeting"
                            ? "bg-green-500"
                            : ev.type === "quota"
                              ? ev.status === "overdue"
                                ? "bg-red-500"
                                : "bg-blue-500"
                              : "bg-orange-500"
                        }`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: events for selected date or upcoming */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-card-foreground">
            {selectedDate
              ? `${parseInt(selectedDate.slice(8), 10)} de ${MONTH_NAMES[parseInt(selectedDate.slice(5, 7), 10) - 1]}`
              : "Próximos eventos"}
          </h3>

          {selectedDate ? (
            selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem eventos nesta data
              </p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev, i) => (
                  <EventCard key={i} event={ev} />
                ))}
              </div>
            )
          ) : (
            <UpcomingEvents events={events} today={todayStr} />
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const Icon = EVENT_ICONS[event.type] || Wallet;
  const colorClass = EVENT_COLORS[event.type] || "bg-muted text-foreground";

  return (
    <div className={`rounded-lg border p-3 ${colorClass}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} />
        <span className="text-sm font-medium">{event.label}</span>
      </div>
      {event.detail && (
        <p className="mt-1 text-xs opacity-80">{event.detail}</p>
      )}
      {event.status === "cancelled" && (
        <span className="mt-1 inline-block rounded-full bg-red-200 px-1.5 py-0.5 text-[10px] font-medium text-red-800">
          Cancelada
        </span>
      )}
      {event.status === "overdue" && (
        <span className="mt-1 inline-block rounded-full bg-red-200 px-1.5 py-0.5 text-[10px] font-medium text-red-800">
          Em atraso
        </span>
      )}
    </div>
  );
}

function UpcomingEvents({
  events,
  today,
}: {
  events: CalendarEvent[];
  today: string;
}) {
  const upcoming = events
    .filter((e) => e.date >= today && e.status !== "cancelled" && e.status !== "done")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  if (upcoming.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem eventos futuros registados
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((ev, i) => {
        const day = parseInt(ev.date.slice(8), 10);
        const monthIdx = parseInt(ev.date.slice(5, 7), 10) - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex w-10 flex-col items-center">
              <span className="text-xs text-muted-foreground">
                {MONTH_NAMES[monthIdx].slice(0, 3)}
              </span>
              <span className="text-lg font-bold text-foreground">{day}</span>
            </div>
            <div className="flex-1">
              <EventCard event={ev} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
