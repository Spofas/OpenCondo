/**
 * Shared test fixtures with realistic Portuguese condominium data.
 *
 * Two condos:
 * - Edifício Aurora: 6-unit building, permilagem model, €9000/year budget
 * - Vivenda Sol:     3-unit building, equal model, €3600/year budget
 */

// ── Units ──────────────────────────────────────────────────────────────────

export const AURORA_UNITS = [
  { id: "aurora-rc-esq", identifier: "R/C Esq", floor: 0, typology: "T1", permilagem: 100 },
  { id: "aurora-rc-dto", identifier: "R/C Dto", floor: 0, typology: "T2", permilagem: 130 },
  { id: "aurora-1-esq", identifier: "1.º Esq", floor: 1, typology: "T2", permilagem: 160 },
  { id: "aurora-1-dto", identifier: "1.º Dto", floor: 1, typology: "T3", permilagem: 200 },
  { id: "aurora-2-esq", identifier: "2.º Esq", floor: 2, typology: "T3", permilagem: 190 },
  { id: "aurora-2-dto", identifier: "2.º Dto", floor: 2, typology: "T4", permilagem: 220 },
] as const;

export const AURORA_TOTAL_PERMILAGEM = AURORA_UNITS.reduce((s, u) => s + u.permilagem, 0); // 1000

export const SOL_UNITS = [
  { id: "sol-a", identifier: "Fração A", floor: 0, typology: "T2", permilagem: 333 },
  { id: "sol-b", identifier: "Fração B", floor: 1, typology: "T2", permilagem: 333 },
  { id: "sol-c", identifier: "Fração C", floor: 2, typology: "T3", permilagem: 334 },
] as const;

// ── Owners ─────────────────────────────────────────────────────────────────

export const AURORA_OWNERS: Record<string, { name: string; email: string }> = {
  "aurora-rc-esq": { name: "Ana Silva", email: "ana@test.com" },
  "aurora-rc-dto": { name: "Bruno Costa", email: "bruno@test.com" },
  "aurora-1-esq": { name: "Carla Dias", email: "carla@test.com" },
  "aurora-1-dto": { name: "Daniel Ferreira", email: "daniel@test.com" },
  "aurora-2-esq": { name: "Eva Gomes", email: "eva@test.com" },
  "aurora-2-dto": { name: "Filipe Henriques", email: "filipe@test.com" },
};

// ── Budget ─────────────────────────────────────────────────────────────────

export const AURORA_BUDGET = {
  year: 2026,
  totalAmount: 9000,
  status: "APPROVED" as const,
  reserveFundPercentage: 10,
  items: [
    { category: "Limpeza", description: "Limpeza escadas e garagem", plannedAmount: 2400 },
    { category: "Elevador", description: "Manutenção elevador", plannedAmount: 1800 },
    { category: "Seguro", description: "Seguro do edifício", plannedAmount: 1200 },
    { category: "Eletricidade", description: "Partes comuns", plannedAmount: 960 },
    { category: "Água", description: "Partes comuns", plannedAmount: 480 },
    { category: "Gestão", description: "Honorários administração", plannedAmount: 1200 },
    { category: "Diversos", description: null, plannedAmount: 960 },
  ],
};

export const AURORA_MONTHLY_AMOUNT = AURORA_BUDGET.totalAmount / 12; // 750

// ── Expenses (realistic year of spending) ──────────────────────────────────

export function makeAuroraExpenses() {
  const expenses: { category: string; amount: number; date: string }[] = [];

  // Monthly recurring
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    expenses.push({ category: "Limpeza", amount: 200, date: `2026-${mm}-05` });
    expenses.push({ category: "Eletricidade", amount: 80, date: `2026-${mm}-15` });
    expenses.push({ category: "Água", amount: 40, date: `2026-${mm}-15` });
  }
  // Quarterly
  for (const m of ["03", "06", "09", "12"]) {
    expenses.push({ category: "Elevador", amount: 450, date: `2026-${m}-10` });
  }
  // Annual
  expenses.push({ category: "Seguro", amount: 1150, date: "2026-01-20" });
  expenses.push({ category: "Gestão", amount: 1200, date: "2026-06-01" });
  // A few one-off repairs
  expenses.push({ category: "Diversos", amount: 320, date: "2026-04-22" });
  expenses.push({ category: "Diversos", amount: 180, date: "2026-09-14" });

  return expenses;
}

// ── Quotas helper ──────────────────────────────────────────────────────────

import { splitByPermilagem } from "../quota-calculations";

export interface TestQuota {
  unitId: string;
  unitIdentifier: string;
  unitFloor: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  amount: number;
  period: string;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paymentDate?: string;
}

/**
 * Generate a full year of monthly quotas for Aurora, with configurable payment status.
 * @param paidMonths map of unitId → set of period strings that are PAID
 * @param today reference date for determining overdue
 */
export function makeAuroraQuotas(
  paidMonths: Map<string, Set<string>>,
  today: Date
): TestQuota[] {
  const quotas: TestQuota[] = [];

  for (let m = 1; m <= 12; m++) {
    const period = `2026-${String(m).padStart(2, "0")}`;
    const dueDate = `2026-${String(m).padStart(2, "0")}-08`; // due on the 8th
    const dueDateObj = new Date(dueDate);
    const splits = splitByPermilagem(AURORA_MONTHLY_AMOUNT, [...AURORA_UNITS]);

    for (const unit of AURORA_UNITS) {
      const amount = splits.get(unit.id) || 0;
      const owner = AURORA_OWNERS[unit.id];
      const isPaid = paidMonths.get(unit.id)?.has(period) ?? false;

      let status: TestQuota["status"];
      if (isPaid) {
        status = "PAID";
      } else if (dueDateObj < today) {
        status = "OVERDUE";
      } else {
        status = "PENDING";
      }

      quotas.push({
        unitId: unit.id,
        unitIdentifier: unit.identifier,
        unitFloor: unit.floor,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        amount,
        period,
        dueDate,
        status,
        ...(isPaid ? { paymentDate: `${period}-10` } : {}),
      });
    }
  }

  return quotas;
}

// ── CSV fixture ────────────────────────────────────────────────────────────

export const AURORA_CSV_SEMICOLON = `identificador;piso;tipologia;permilagem;email
R/C Esq;0;T1;100;ana@test.com
R/C Dto;0;T2;130;bruno@test.com
1.º Esq;1;T2;160;carla@test.com
1.º Dto;1;T3;200;daniel@test.com
2.º Esq;2;T3;190;eva@test.com
2.º Dto;2;T4;220;filipe@test.com`;

export const AURORA_CSV_COMMA = `fracao,andar,tipo,permil,proprietario
R/C Esq,0,T1,100,ana@test.com
R/C Dto,0,T2,130,bruno@test.com
1.º Esq,1,T2,160,carla@test.com
1.º Dto,1,T3,200,daniel@test.com
2.º Esq,2,T3,190,eva@test.com
2.º Dto,2,T4,220,filipe@test.com`;
