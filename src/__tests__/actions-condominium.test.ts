import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth — returns a fake session
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock cookies — Next.js headers
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ set: mockCookieSet, get: vi.fn() }),
}));

// Mock db — tracks all Prisma calls
const mockTransaction = vi.fn();
const mockDb = {
  $transaction: mockTransaction,
};
vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

// Import AFTER mocks are set up
const { createCondominiumWithUnits } = await import(
  "@/app/(auth)/onboarding/actions"
);

const validCondo = {
  name: "Edifício Aurora",
  address: "Rua das Flores, 123",
  postalCode: "1234-567",
  city: "Lisboa",
  nif: "123456789",
  quotaModel: "PERMILAGEM",
};

const validUnits = [
  { identifier: "1.º Esq", floor: "1", typology: "T2", permilagem: 500 },
  { identifier: "1.º Dto", floor: "1", typology: "T3", permilagem: 500 },
];

describe("createCondominiumWithUnits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createCondominiumWithUnits(validCondo, validUnits);
    expect(result).toEqual({ error: "Não autenticado" });
  });

  it("returns error for invalid condominium data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createCondominiumWithUnits(
      { name: "X" }, // too short, missing required fields
      validUnits
    );
    expect(result.error).toBeDefined();
  });

  it("returns error for empty units array", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createCondominiumWithUnits(validCondo, []);
    expect(result.error).toBeDefined();
  });

  it("returns error when permilagem does not sum to 1000", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const badUnits = [
      { identifier: "1A", permilagem: 400 },
      { identifier: "1B", permilagem: 400 },
    ];
    const result = await createCondominiumWithUnits(validCondo, badUnits);
    expect(result.error).toContain("1000");
  });

  it("skips permilagem check for EQUAL quota model", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockTransaction.mockResolvedValue({ id: "condo-1" });

    const equalCondo = { ...validCondo, quotaModel: "EQUAL" };
    const units = [{ identifier: "1A", permilagem: 0 }];

    const result = await createCondominiumWithUnits(equalCondo, units);
    expect(result).toEqual({ success: true, condominiumId: "condo-1" });
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("creates condominium, membership, and units in a transaction", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        condominium: {
          create: vi.fn().mockResolvedValue({ id: "condo-1" }),
        },
        membership: { create: vi.fn().mockResolvedValue({}) },
        unit: { createMany: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await createCondominiumWithUnits(validCondo, validUnits);
    expect(result).toEqual({ success: true, condominiumId: "condo-1" });
  });
});
