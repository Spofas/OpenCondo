import { z } from "zod";

export const MEETING_TYPES = ["ORDINARIA", "EXTRAORDINARIA"] as const;
export const MEETING_STATUSES = ["AGENDADA", "REALIZADA", "CANCELADA"] as const;
export const ATTENDEE_STATUSES = ["PRESENTE", "REPRESENTADO", "AUSENTE"] as const;
export const VOTE_VALUES = ["A_FAVOR", "CONTRA", "ABSTENCAO"] as const;

export const meetingSchema = z.object({
  date: z.string().min(1, "Data é obrigatória").max(20),
  time: z.string().min(1, "Hora é obrigatória").max(10),
  location: z.string().min(1, "Local é obrigatório").max(200, "Local demasiado longo"),
  type: z.enum(MEETING_TYPES, { message: "Tipo é obrigatório" }),
  agendaItems: z
    .array(
      z.object({
        title: z.string().min(1, "Título do ponto é obrigatório").max(200, "Título demasiado longo"),
        description: z.string().max(2000, "Descrição demasiado longa").optional(),
      })
    )
    .min(1, "Pelo menos um ponto de ordem é obrigatório"),
});

export type MeetingInput = z.infer<typeof meetingSchema>;

export const attendanceSchema = z.object({
  attendees: z.array(
    z.object({
      userId: z.string(),
      status: z.enum(ATTENDEE_STATUSES),
      representedBy: z.string().max(200).optional(),
    })
  ),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;

export const voteSchema = z.object({
  agendaItemId: z.string().min(1),
  votes: z.array(
    z.object({
      unitId: z.string(),
      vote: z.enum(VOTE_VALUES),
    })
  ),
});

export type VoteInput = z.infer<typeof voteSchema>;

export const ataSchema = z.object({
  content: z.string().min(1, "Conteúdo da ata é obrigatório").max(50000, "Conteúdo demasiado longo"),
});

export type AtaInput = z.infer<typeof ataSchema>;

export const TYPE_LABELS: Record<string, string> = {
  ORDINARIA: "Ordinária",
  EXTRAORDINARIA: "Extraordinária",
};

export const STATUS_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
};

export const ATTENDEE_STATUS_LABELS: Record<string, string> = {
  PRESENTE: "Presente",
  REPRESENTADO: "Representado",
  AUSENTE: "Ausente",
};

export const VOTE_LABELS: Record<string, string> = {
  A_FAVOR: "A favor",
  CONTRA: "Contra",
  ABSTENCAO: "Abstenção",
};
