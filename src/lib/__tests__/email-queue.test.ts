import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db before importing the module under test
vi.mock("@/lib/db", () => ({
  db: {
    pendingEmail: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockSend = vi.fn();
vi.mock("@/lib/email", () => ({
  getResend: () => ({
    emails: {
      send: mockSend,
    },
  }),
}));

import { db } from "@/lib/db";
import { queueEmail, processPendingEmails } from "../email-queue";

const mockCreate = db.pendingEmail.create as ReturnType<typeof vi.fn>;
const mockFindMany = db.pendingEmail.findMany as ReturnType<typeof vi.fn>;
const mockUpdate = db.pendingEmail.update as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("queueEmail", () => {
  it("creates a PendingEmail record with the correct data", async () => {
    mockCreate.mockResolvedValue({});

    await queueEmail({
      recipient: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      type: "QUOTA_REMINDER",
      referenceId: "quota-123",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        recipient: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        type: "QUOTA_REMINDER",
        referenceId: "quota-123",
      },
    });
  });

  it("sets referenceId to null when not provided", async () => {
    mockCreate.mockResolvedValue({});

    await queueEmail({
      recipient: "user@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      type: "ANNOUNCEMENT",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        referenceId: null,
      }),
    });
  });
});

describe("processPendingEmails", () => {
  it("sends pending emails and marks them as sent", async () => {
    const pendingEmails = [
      {
        id: "email-1",
        recipient: "a@example.com",
        subject: "Subject A",
        html: "<p>A</p>",
        retries: 0,
      },
      {
        id: "email-2",
        recipient: "b@example.com",
        subject: "Subject B",
        html: "<p>B</p>",
        retries: 1,
      },
    ];

    mockFindMany.mockResolvedValue(pendingEmails);
    mockSend.mockResolvedValue({ id: "resend-id" });
    mockUpdate.mockResolvedValue({});

    const result = await processPendingEmails();

    expect(result).toEqual({ sent: 2, failed: 0 });
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenCalledWith({
      from: "OpenCondo <noreply@opencondo.app>",
      to: "a@example.com",
      subject: "Subject A",
      html: "<p>A</p>",
    });
  });

  it("marks emails as sent with a sentAt timestamp on success", async () => {
    const pendingEmails = [
      {
        id: "email-1",
        recipient: "a@example.com",
        subject: "Subject",
        html: "<p>Hi</p>",
        retries: 0,
      },
    ];

    mockFindMany.mockResolvedValue(pendingEmails);
    mockSend.mockResolvedValue({ id: "resend-id" });
    mockUpdate.mockResolvedValue({});

    await processPendingEmails();

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: { sentAt: expect.any(Date) },
    });
  });

  it("increments retries and records error on send failure", async () => {
    const pendingEmails = [
      {
        id: "email-1",
        recipient: "a@example.com",
        subject: "Subject",
        html: "<p>Hi</p>",
        retries: 1,
      },
    ];

    mockFindMany.mockResolvedValue(pendingEmails);
    mockSend.mockRejectedValue(new Error("SMTP timeout"));
    mockUpdate.mockResolvedValue({});

    const result = await processPendingEmails();

    expect(result).toEqual({ sent: 0, failed: 1 });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: {
        retries: 2,
        lastError: "SMTP timeout",
      },
    });
  });

  it("handles non-Error exceptions with 'Unknown error' message", async () => {
    const pendingEmails = [
      {
        id: "email-1",
        recipient: "a@example.com",
        subject: "Subject",
        html: "<p>Hi</p>",
        retries: 0,
      },
    ];

    mockFindMany.mockResolvedValue(pendingEmails);
    mockSend.mockRejectedValue("string error");
    mockUpdate.mockResolvedValue({});

    await processPendingEmails();

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "email-1" },
      data: {
        retries: 1,
        lastError: "Unknown error",
      },
    });
  });

  it("queries only unsent emails with retries below the max", async () => {
    mockFindMany.mockResolvedValue([]);

    await processPendingEmails();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        sentAt: null,
        retries: { lt: 3 },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
  });

  it("processes at most 50 emails per batch", async () => {
    mockFindMany.mockResolvedValue([]);

    await processPendingEmails();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it("returns zero counts when there are no pending emails", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await processPendingEmails();

    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("handles mixed success and failure in the same batch", async () => {
    const pendingEmails = [
      { id: "ok", recipient: "a@x.com", subject: "A", html: "a", retries: 0 },
      { id: "fail", recipient: "b@x.com", subject: "B", html: "b", retries: 0 },
      { id: "ok2", recipient: "c@x.com", subject: "C", html: "c", retries: 0 },
    ];

    mockFindMany.mockResolvedValue(pendingEmails);
    mockSend
      .mockResolvedValueOnce({ id: "r1" })
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ id: "r3" });
    mockUpdate.mockResolvedValue({});

    const result = await processPendingEmails();

    expect(result).toEqual({ sent: 2, failed: 1 });
  });
});
