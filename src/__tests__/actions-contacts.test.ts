import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock db
const mockMembershipFindUnique = vi.fn();
const mockMembershipFindFirst = vi.fn();
const mockSupplierCreate = vi.fn();
const mockSupplierFindFirst = vi.fn();
const mockSupplierUpdate = vi.fn();
const mockSupplierDelete = vi.fn();
const mockContractCount = vi.fn();
const mockExpenseCount = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    membership: {
      findUnique: (...args: unknown[]) => mockMembershipFindUnique(...args),
      findFirst: (...args: unknown[]) => mockMembershipFindFirst(...args),
    },
    supplier: {
      create: (...args: unknown[]) => mockSupplierCreate(...args),
      findFirst: (...args: unknown[]) => mockSupplierFindFirst(...args),
      update: (...args: unknown[]) => mockSupplierUpdate(...args),
      delete: (...args: unknown[]) => mockSupplierDelete(...args),
    },
    contract: {
      count: (...args: unknown[]) => mockContractCount(...args),
    },
    expense: {
      count: (...args: unknown[]) => mockExpenseCount(...args),
    },
  },
}));

const { createContact, updateContact, deleteContact } = await import(
  "@/app/(dashboard)/c/[slug]/comunicacao/contactos/actions"
);

const validInput = {
  name: "Bombeiros Voluntários",
  phone: "217 123 456",
  email: "geral@bombeiros.pt",
  category: "emergencia",
  notes: "24h",
  visibility: "ALL" as const,
};

function mockAdminSession() {
  mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  mockMembershipFindUnique.mockResolvedValue({
    role: "ADMIN",
    condominiumId: "condo-1",
    condominium: { slug: "test-condo" },
  });
}

function mockNonAdminSession() {
  mockAuth.mockResolvedValue({ user: { id: "user-2" } });
  mockMembershipFindUnique.mockResolvedValue({
    role: "OWNER",
    condominiumId: "condo-1",
    condominium: { slug: "test-condo" },
  });
}

describe("createContact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createContact("condo-1", validInput);
    expect(result).toEqual({ error: "Sem permissão" });
  });

  it("returns error when not admin", async () => {
    mockNonAdminSession();
    const result = await createContact("condo-1", validInput);
    expect(result).toEqual({ error: "Sem permissão" });
  });

  it("creates contact for admin", async () => {
    mockAdminSession();
    mockSupplierCreate.mockResolvedValue({ id: "s-1" });

    const result = await createContact("condo-1", validInput);
    expect(result).toEqual({ success: true });
    expect(mockSupplierCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        condominiumId: "condo-1",
        name: "Bombeiros Voluntários",
        visibility: "ALL",
      }),
    });
  });

  it("returns error for invalid input", async () => {
    mockAdminSession();
    const result = await createContact({ ...validInput, name: "" });
    expect(result.error).toBeTruthy();
  });
});

describe("updateContact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not admin", async () => {
    mockNonAdminSession();
    const result = await updateContact("condo-1", "s-1", validInput);
    expect(result).toEqual({ error: "Sem permissão" });
  });

  it("returns error when contact not found", async () => {
    mockAdminSession();
    mockSupplierFindFirst.mockResolvedValue(null);

    const result = await updateContact("condo-1", "s-1", validInput);
    expect(result).toEqual({ error: "Contacto não encontrado" });
  });

  it("updates contact for admin", async () => {
    mockAdminSession();
    mockSupplierFindFirst.mockResolvedValue({ id: "s-1" });
    mockSupplierUpdate.mockResolvedValue({ id: "s-1" });

    const result = await updateContact("condo-1", "s-1", {
      ...validInput,
      name: "Bombeiros Profissionais",
    });
    expect(result).toEqual({ success: true });
    expect(mockSupplierUpdate).toHaveBeenCalledWith({
      where: { id: "s-1" },
      data: expect.objectContaining({ name: "Bombeiros Profissionais" }),
    });
  });
});

describe("deleteContact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not admin", async () => {
    mockNonAdminSession();
    const result = await deleteContact("condo-1", "s-1");
    expect(result).toEqual({ error: "Sem permissão" });
  });

  it("returns error when contact not found", async () => {
    mockAdminSession();
    mockSupplierFindFirst.mockResolvedValue(null);

    const result = await deleteContact("condo-1", "s-1");
    expect(result).toEqual({ error: "Contacto não encontrado" });
  });

  it("blocks deletion when linked to contracts", async () => {
    mockAdminSession();
    mockSupplierFindFirst.mockResolvedValue({ id: "s-1" });
    mockContractCount.mockResolvedValue(2);
    mockExpenseCount.mockResolvedValue(0);

    const result = await deleteContact("condo-1", "s-1");
    expect(result.error).toContain("2 contratos");
  });

  it("blocks deletion when linked to expenses", async () => {
    mockAdminSession();
    mockSupplierFindFirst.mockResolvedValue({ id: "s-1" });
    mockContractCount.mockResolvedValue(0);
    mockExpenseCount.mockResolvedValue(3);

    const result = await deleteContact("condo-1", "s-1");
    expect(result.error).toContain("3 despesas");
  });

  it("deletes unlinked contact for admin", async () => {
    mockAdminSession();
    mockSupplierFindFirst.mockResolvedValue({ id: "s-1" });
    mockContractCount.mockResolvedValue(0);
    mockExpenseCount.mockResolvedValue(0);
    mockSupplierDelete.mockResolvedValue({ id: "s-1" });

    const result = await deleteContact("condo-1", "s-1");
    expect(result).toEqual({ success: true });
    expect(mockSupplierDelete).toHaveBeenCalledWith({ where: { id: "s-1" } });
  });
});
