import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock cookies
vi.mock("next/headers", () => ({
  cookies: () => ({
    set: vi.fn(),
  }),
}));

// Mock db
const mockInviteFindUnique = vi.fn();
const mockInviteCreate = vi.fn();
const mockInviteFindMany = vi.fn();
const mockInviteUpdate = vi.fn();
const mockMembershipFindUnique = vi.fn();
const mockMembershipCreate = vi.fn();
const mockCondominiumFindUnique = vi.fn();
const mockDbTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    invite: {
      findUnique: (...args: unknown[]) => mockInviteFindUnique(...args),
      create: (...args: unknown[]) => mockInviteCreate(...args),
      findMany: (...args: unknown[]) => mockInviteFindMany(...args),
      update: (...args: unknown[]) => mockInviteUpdate(...args),
    },
    membership: {
      findUnique: (...args: unknown[]) => mockMembershipFindUnique(...args),
      create: (...args: unknown[]) => mockMembershipCreate(...args),
    },
    condominium: {
      findUnique: (...args: unknown[]) => mockCondominiumFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockDbTransaction(...args),
  },
}));

const { joinWithInvite } = await import("@/app/(auth)/entrar/actions");
const { createInvite, listInvites } = await import(
  "@/app/(dashboard)/actions"
);

describe("joinWithInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await joinWithInvite("some-token");
    expect(result).toEqual({ error: "Não autenticado" });
  });

  it("returns error for invalid token", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "a@b.com" } });
    mockInviteFindUnique.mockResolvedValue(null);

    const result = await joinWithInvite("bad-token");
    expect(result).toEqual({ error: "Código de convite inválido" });
  });

  it("returns error for already used invite", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "a@b.com" } });
    mockInviteFindUnique.mockResolvedValue({
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });

    const result = await joinWithInvite("used-token");
    expect(result).toEqual({ error: "Este convite já foi utilizado" });
  });

  it("returns error for expired invite", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "a@b.com" } });
    mockInviteFindUnique.mockResolvedValue({
      usedAt: null,
      expiresAt: new Date(Date.now() - 86400000), // expired yesterday
    });

    const result = await joinWithInvite("expired-token");
    expect(result).toEqual({ error: "Este convite expirou" });
  });

  it("returns error when email does not match restricted invite", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "a@b.com" } });
    mockInviteFindUnique.mockResolvedValue({
      usedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      email: "other@b.com",
    });

    const result = await joinWithInvite("restricted-token");
    expect(result).toEqual({ error: "Este convite não é válido para o seu email" });
  });

  it("returns error when already a member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "a@b.com" } });
    mockInviteFindUnique.mockResolvedValue({
      usedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      email: null,
      condominiumId: "condo-1",
    });
    mockMembershipFindUnique.mockResolvedValue({ id: "existing" });

    const result = await joinWithInvite("valid-token");
    expect(result).toEqual({ error: "Já é membro deste condomínio" });
  });

  it("succeeds and returns condominium name", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "a@b.com" } });
    mockInviteFindUnique.mockResolvedValue({
      id: "inv-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      email: null,
      condominiumId: "condo-1",
      role: "OWNER",
      condominium: { name: "Edifício Aurora" },
    });
    mockMembershipFindUnique.mockResolvedValue(null);
    mockDbTransaction.mockResolvedValue(undefined);

    const result = await joinWithInvite("valid-token");
    expect(result).toEqual({ success: true, condominiumName: "Edifício Aurora" });
  });
});

describe("createInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createInvite({ condominiumId: "c1", role: "OWNER" });
    expect(result).toEqual({ error: "Não autenticado" });
  });

  it("returns error when user is not ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockMembershipFindUnique.mockResolvedValue({ role: "OWNER" });

    const result = await createInvite({ condominiumId: "c1", role: "OWNER" });
    expect(result).toEqual({ error: "Apenas administradores podem criar convites" });
  });

  it("creates invite and returns token", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockMembershipFindUnique.mockResolvedValue({ role: "ADMIN" });
    mockCondominiumFindUnique.mockResolvedValue({ name: "Edifício Teste" });
    mockInviteCreate.mockResolvedValue({ token: "abc-123" });

    const result = await createInvite({ condominiumId: "c1", role: "OWNER" });
    expect(result).toEqual({ success: true, token: "abc-123" });
  });
});

describe("listInvites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await listInvites("c1");
    expect(result).toEqual({ error: "Não autenticado" });
  });

  it("returns error when not ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockMembershipFindUnique.mockResolvedValue({ role: "TENANT" });

    const result = await listInvites("c1");
    expect(result).toEqual({ error: "Sem permissão" });
  });

  it("returns invites list for admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockMembershipFindUnique.mockResolvedValue({ role: "ADMIN" });
    mockInviteFindMany.mockResolvedValue([{ id: "inv-1" }]);

    const result = await listInvites("c1");
    expect(result).toEqual({ invites: [{ id: "inv-1" }] });
  });
});
