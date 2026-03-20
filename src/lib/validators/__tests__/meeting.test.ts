import { describe, it, expect } from "vitest";
import { meetingSchema, attendanceSchema, voteSchema, ataSchema } from "../meeting";

describe("meetingSchema", () => {
  const valid = {
    date: "2026-04-15",
    time: "19:00",
    location: "Sala de condomínio",
    type: "ORDINARIA",
    agendaItems: [{ title: "Aprovação de contas" }],
  };

  it("accepts a valid meeting", () => {
    const result = meetingSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts multiple agenda items", () => {
    const result = meetingSchema.safeParse({
      ...valid,
      agendaItems: [
        { title: "Aprovação de contas", description: "Contas de 2025" },
        { title: "Orçamento 2026" },
        { title: "Diversos" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty date", () => {
    const result = meetingSchema.safeParse({ ...valid, date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty time", () => {
    const result = meetingSchema.safeParse({ ...valid, time: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty location", () => {
    const result = meetingSchema.safeParse({ ...valid, location: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty agenda items", () => {
    const result = meetingSchema.safeParse({ ...valid, agendaItems: [] });
    expect(result.success).toBe(false);
  });

  it("rejects agenda item without title", () => {
    const result = meetingSchema.safeParse({
      ...valid,
      agendaItems: [{ title: "" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("attendanceSchema", () => {
  it("accepts valid attendance list", () => {
    const result = attendanceSchema.safeParse({
      attendees: [
        { userId: "user1", status: "PRESENTE" },
        { userId: "user2", status: "AUSENTE" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts represented attendee", () => {
    const result = attendanceSchema.safeParse({
      attendees: [
        { userId: "user1", status: "REPRESENTADO", representedBy: "João Silva" },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("voteSchema", () => {
  it("accepts valid votes", () => {
    const result = voteSchema.safeParse({
      agendaItemId: "item1",
      votes: [
        { unitId: "unit1", vote: "A_FAVOR" },
        { unitId: "unit2", vote: "CONTRA" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty agendaItemId", () => {
    const result = voteSchema.safeParse({
      agendaItemId: "",
      votes: [{ unitId: "unit1", vote: "A_FAVOR" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("ataSchema", () => {
  it("accepts valid ata content", () => {
    const result = ataSchema.safeParse({
      content: "Ata da assembleia realizada em 15 de abril de 2026...",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = ataSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});
