"use client";

import { useState } from "react";
import {
  Users,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import {
  updateMeetingStatus,
  saveAttendance,
  recordVotes,
  saveAta,
  deleteMeeting,
} from "./actions";
import {
  TYPE_LABELS,
  STATUS_LABELS,
  ATTENDEE_STATUSES,
  ATTENDEE_STATUS_LABELS,
  VOTE_VALUES,
  VOTE_LABELS,
} from "@/lib/validators/meeting";
import type {
  MeetingData,
  UnitData,
  MemberData,
} from "./meeting-page-client";

const STATUS_COLORS: Record<string, string> = {
  AGENDADA: "bg-blue-100 text-blue-700",
  REALIZADA: "bg-green-100 text-green-700",
  CANCELADA: "bg-red-100 text-red-700",
};

export function MeetingList({
  meetings,
  units,
  members,
  isAdmin,
}: {
  meetings: MeetingData[];
  units: UnitData[];
  members: MemberData[];
  isAdmin: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("agenda");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [ataText, setAtaText] = useState("");

  async function handleStatusChange(meetingId: string, status: string) {
    setActionError("");
    const result = await updateMeetingStatus(meetingId, status);
    if (result.error) setActionError(result.error);
  }

  async function handleDelete(id: string) {
    setActionError("");
    const result = await deleteMeeting(id);
    if (result.error) setActionError(result.error);
    setConfirmDelete(null);
  }

  async function handleAttendanceChange(
    meetingId: string,
    userId: string,
    status: string
  ) {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return;

    const attendees = members.map((member) => {
      const existing = meeting.attendees.find(
        (a) => a.userId === member.userId
      );
      return {
        userId: member.userId,
        status:
          member.userId === userId
            ? status
            : existing?.status || "AUSENTE",
        representedBy: existing?.representedBy || undefined,
      };
    });

    const result = await saveAttendance(meetingId, { attendees });
    if (result.error) setActionError(result.error);
  }

  async function handleVote(
    meetingId: string,
    agendaItemId: string,
    unitId: string,
    vote: string
  ) {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return;

    const existingVotes = meeting.votes
      .filter((v) => v.agendaItemId === agendaItemId)
      .map((v) => ({ unitId: v.unitId, vote: v.vote }));

    const updated = existingVotes.filter((v) => v.unitId !== unitId);
    updated.push({ unitId, vote });

    const result = await recordVotes(meetingId, {
      agendaItemId,
      votes: updated,
    });
    if (result.error) setActionError(result.error);
  }

  async function handleSaveAta(meetingId: string) {
    if (!ataText.trim()) return;
    const result = await saveAta(meetingId, { content: ataText });
    if (result.error) setActionError(result.error);
  }

  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Users size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhuma assembleia agendada</p>
          <p className="text-xs">
            Agende a assembleia de condóminos e envie a convocatória
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="space-y-4">
        {meetings.map((meeting) => {
          const isExpanded = expandedId === meeting.id;
          const meetingDate = new Date(meeting.date);

          // Calculate quorum
          const presentPermilagem = meeting.attendees
            .filter(
              (a) => a.status === "PRESENTE" || a.status === "REPRESENTADO"
            )
            .reduce((sum, a) => sum + a.permilagem, 0);

          return (
            <div
              key={meeting.id}
              className="rounded-xl border border-border bg-card"
            >
              {/* Header */}
              <div
                className="flex cursor-pointer items-center justify-between p-5"
                onClick={() => {
                  setExpandedId(isExpanded ? null : meeting.id);
                  setActiveTab("agenda");
                  if (meeting.ataContent) setAtaText(meeting.ataContent);
                }}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground">
                        Assembleia {TYPE_LABELS[meeting.type]}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[meeting.status] ||
                          "bg-muted text-foreground"
                        }`}
                      >
                        {STATUS_LABELS[meeting.status]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {meetingDate.toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        às{" "}
                        {meetingDate.toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {meeting.location}
                      </span>
                      <span>
                        {meeting.agendaItems.length} ponto
                        {meeting.agendaItems.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && meeting.status === "AGENDADA" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(meeting.id, "REALIZADA");
                        }}
                        className="rounded-lg p-1.5 text-green-600 hover:bg-green-100"
                        title="Marcar como realizada"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(meeting.id, "CANCELADA");
                        }}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-100"
                        title="Cancelar"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      {confirmDelete === meeting.id ? (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleDelete(meeting.id)}
                            className="rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-white hover:bg-destructive/90"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(meeting.id);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border px-5 pb-5">
                  {/* Tabs */}
                  <div className="flex gap-1 border-b border-border py-3">
                    {["agenda", "presencas", "votacao", "ata"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {tab === "agenda" && "Ordem de trabalhos"}
                        {tab === "presencas" && "Presenças"}
                        {tab === "votacao" && "Votação"}
                        {tab === "ata" && "Ata"}
                      </button>
                    ))}
                  </div>

                  {/* Agenda tab */}
                  {activeTab === "agenda" && (
                    <div className="mt-4 space-y-2">
                      {meeting.agendaItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border/50 p-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              {item.order}.
                            </span>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attendance tab */}
                  {activeTab === "presencas" && (
                    <div className="mt-4">
                      <div className="mb-3 rounded-lg bg-muted/50 p-3 text-sm">
                        <span className="font-medium">Quórum: </span>
                        {presentPermilagem}‰ de 1000‰
                        {presentPermilagem >= 500 ? (
                          <span className="ml-2 text-green-600">
                            (quórum atingido)
                          </span>
                        ) : (
                          <span className="ml-2 text-red-600">
                            (sem quórum)
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {members.map((member) => {
                          const attendee = meeting.attendees.find(
                            (a) => a.userId === member.userId
                          );
                          const currentStatus =
                            attendee?.status || "AUSENTE";

                          return (
                            <div
                              key={member.userId}
                              className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                            >
                              <span className="text-sm font-medium text-foreground">
                                {member.userName}
                              </span>
                              {isAdmin ? (
                                <select
                                  value={currentStatus}
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      meeting.id,
                                      member.userId,
                                      e.target.value
                                    )
                                  }
                                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                                >
                                  {ATTENDEE_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {ATTENDEE_STATUS_LABELS[s]}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {ATTENDEE_STATUS_LABELS[currentStatus]}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Voting tab */}
                  {activeTab === "votacao" && (
                    <div className="mt-4 space-y-4">
                      {meeting.agendaItems.map((item) => {
                        const itemVotes = meeting.votes.filter(
                          (v) => v.agendaItemId === item.id
                        );
                        const summary = {
                          A_FAVOR: itemVotes
                            .filter((v) => v.vote === "A_FAVOR")
                            .reduce((s, v) => s + v.permilagem, 0),
                          CONTRA: itemVotes
                            .filter((v) => v.vote === "CONTRA")
                            .reduce((s, v) => s + v.permilagem, 0),
                          ABSTENCAO: itemVotes
                            .filter((v) => v.vote === "ABSTENCAO")
                            .reduce((s, v) => s + v.permilagem, 0),
                        };

                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border/50 p-4"
                          >
                            <h4 className="mb-3 text-sm font-medium text-foreground">
                              {item.order}. {item.title}
                            </h4>

                            {/* Vote summary */}
                            {itemVotes.length > 0 && (
                              <div className="mb-3 flex gap-4 text-xs">
                                <span className="text-green-600">
                                  A favor: {summary.A_FAVOR}‰
                                </span>
                                <span className="text-red-600">
                                  Contra: {summary.CONTRA}‰
                                </span>
                                <span className="text-muted-foreground">
                                  Abstenção: {summary.ABSTENCAO}‰
                                </span>
                              </div>
                            )}

                            {isAdmin && (
                              <div className="space-y-2">
                                {units.map((unit) => {
                                  const currentVote = itemVotes.find(
                                    (v) => v.unitId === unit.id
                                  );
                                  return (
                                    <div
                                      key={unit.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-foreground">
                                        {unit.identifier}
                                        {unit.ownerName && (
                                          <span className="ml-1 text-xs text-muted-foreground">
                                            ({unit.ownerName})
                                          </span>
                                        )}
                                        <span className="ml-1 text-xs text-muted-foreground">
                                          {unit.permilagem}‰
                                        </span>
                                      </span>
                                      <div className="flex gap-1">
                                        {VOTE_VALUES.map((v) => (
                                          <button
                                            key={v}
                                            onClick={() =>
                                              handleVote(
                                                meeting.id,
                                                item.id,
                                                unit.id,
                                                v
                                              )
                                            }
                                            className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                                              currentVote?.vote === v
                                                ? v === "A_FAVOR"
                                                  ? "bg-green-100 text-green-700"
                                                  : v === "CONTRA"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-gray-100 text-gray-700"
                                                : "text-muted-foreground hover:bg-muted"
                                            }`}
                                          >
                                            {VOTE_LABELS[v]}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ata tab */}
                  {activeTab === "ata" && (
                    <div className="mt-4">
                      {isAdmin ? (
                        <>
                          <textarea
                            rows={10}
                            value={ataText}
                            onChange={(e) => setAtaText(e.target.value)}
                            placeholder="Escreva a ata da assembleia..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                          />
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleSaveAta(meeting.id)}
                              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              <FileText size={14} />
                              Guardar ata
                            </button>
                          </div>
                        </>
                      ) : meeting.ataContent ? (
                        <div className="whitespace-pre-wrap rounded-lg border border-border/50 p-4 text-sm text-foreground">
                          {meeting.ataContent}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          A ata ainda não foi redigida
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
