/**
 * Database seed for manual testing.
 *
 * Creates 2 condominiums with realistic data spanning 2025–2026:
 *
 * 1. Edifício Aurora (Lisboa) — 6 units, permilagem model
 * 2. Residências do Jardim (Porto) — 4 units, permilagem model
 *
 * 10 users total, some with cross-condo memberships.
 * Budgets, quotas, expenses, meetings, contracts, etc. for both years.
 *
 * Login credentials (all use password123):
 *   Admin:   admin@aurora.pt
 *   Admin:   pedro@jardim.pt
 *   Owner:   joao@example.com     (Aurora + Jardim)
 *   Owner:   maria@example.com    (Aurora)
 *   Owner:   carlos@example.com   (Aurora)
 *   Owner:   sofia@example.com    (Jardim)
 *   Owner:   ricardo@example.com  (Jardim)
 *   Owner:   beatriz@example.com  (Jardim)
 *   Tenant:  ana@example.com      (Aurora)
 *   Tenant:  tiago@example.com    (Jardim)
 *
 * Usage: pnpm db:seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── Clean existing data ────────────────────────────────────────────────────
  await db.vote.deleteMany();
  await db.ataApproval.deleteMany();
  await db.ata.deleteMany();
  await db.agendaItem.deleteMany();
  await db.meetingAttendee.deleteMany();
  await db.meeting.deleteMany();
  await db.announcementRead.deleteMany();
  await db.announcementAttachment.deleteMany();
  await db.announcement.deleteMany();
  await db.maintenanceUpdate.deleteMany();
  await db.maintenancePhoto.deleteMany();
  await db.maintenanceRequest.deleteMany();
  await db.transaction.deleteMany();
  await db.quota.deleteMany();
  await db.expense.deleteMany();
  await db.recurringExpense.deleteMany();
  await db.budgetItem.deleteMany();
  await db.budget.deleteMany();
  await db.contract.deleteMany();
  await db.document.deleteMany();
  await db.invite.deleteMany();
  await db.unit.deleteMany();
  await db.supplier.deleteMany();
  await db.membership.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.condominium.deleteMany();
  await db.user.deleteMany();

  console.log("  Cleaned existing data.");

  const passwordHash = await hash("password123", 12);

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: Users (10 total)
  // ═══════════════════════════════════════════════════════════════════════════

  const adminAurora = await db.user.create({
    data: { name: "Administrador Aurora", email: "admin@aurora.pt", passwordHash, phone: "912345678", nif: "123456789" },
  });

  const adminJardim = await db.user.create({
    data: { name: "Pedro Mendes", email: "pedro@jardim.pt", passwordHash, phone: "916789012", nif: "987654321" },
  });

  const joao = await db.user.create({
    data: { name: "João Silva", email: "joao@example.com", passwordHash, phone: "913456789" },
  });

  const maria = await db.user.create({
    data: { name: "Maria Santos", email: "maria@example.com", passwordHash, phone: "914567890" },
  });

  const carlos = await db.user.create({
    data: { name: "Carlos Ferreira", email: "carlos@example.com", passwordHash, phone: "915678901" },
  });

  const sofia = await db.user.create({
    data: { name: "Sofia Oliveira", email: "sofia@example.com", passwordHash, phone: "917890123" },
  });

  const ricardo = await db.user.create({
    data: { name: "Ricardo Pereira", email: "ricardo@example.com", passwordHash, phone: "918901234" },
  });

  const beatriz = await db.user.create({
    data: { name: "Beatriz Almeida", email: "beatriz@example.com", passwordHash, phone: "919012345" },
  });

  const ana = await db.user.create({
    data: { name: "Ana Costa", email: "ana@example.com", passwordHash },
  });

  const tiago = await db.user.create({
    data: { name: "Tiago Rodrigues", email: "tiago@example.com", passwordHash },
  });

  console.log("  Created 10 users.");

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 3: Condominiums + Memberships
  // ═══════════════════════════════════════════════════════════════════════════

  const aurora = await db.condominium.create({
    data: {
      name: "Edifício Aurora",
      slug: "edificio-aurora",
      address: "Rua da Liberdade, 42",
      postalCode: "1250-142",
      city: "Lisboa",
      nif: "501234567",
      totalPermilagem: 1000,
      quotaModel: "PERMILAGEM",
      fiscalYearStart: 1,
    },
  });

  const jardim = await db.condominium.create({
    data: {
      name: "Residências do Jardim",
      slug: "residencias-do-jardim",
      address: "Av. dos Aliados, 128",
      postalCode: "4000-065",
      city: "Porto",
      nif: "509876123",
      totalPermilagem: 1000,
      quotaModel: "PERMILAGEM",
      fiscalYearStart: 1,
    },
  });

  console.log("  Created 2 condominiums: Aurora (Lisboa) + Jardim (Porto).");

  // Memberships — João is owner in both condos, admins manage their own condo
  await db.membership.createMany({
    data: [
      // Aurora: 1 admin, 3 owners, 1 tenant
      { userId: adminAurora.id, condominiumId: aurora.id, role: "ADMIN" },
      { userId: joao.id, condominiumId: aurora.id, role: "OWNER" },
      { userId: maria.id, condominiumId: aurora.id, role: "OWNER" },
      { userId: carlos.id, condominiumId: aurora.id, role: "OWNER" },
      { userId: ana.id, condominiumId: aurora.id, role: "TENANT" },
      // Jardim: 1 admin, 4 owners (including João), 1 tenant
      { userId: adminJardim.id, condominiumId: jardim.id, role: "ADMIN" },
      { userId: joao.id, condominiumId: jardim.id, role: "OWNER" },
      { userId: sofia.id, condominiumId: jardim.id, role: "OWNER" },
      { userId: ricardo.id, condominiumId: jardim.id, role: "OWNER" },
      { userId: beatriz.id, condominiumId: jardim.id, role: "OWNER" },
      { userId: tiago.id, condominiumId: jardim.id, role: "TENANT" },
    ],
  });

  console.log("  Created 11 memberships (João is in both condos).");

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 4: Units
  // ═══════════════════════════════════════════════════════════════════════════

  // Aurora: 6 units, permilagem totals 1000
  const auroraUnitData = [
    { identifier: "R/C Esq", floor: 0, typology: "T1", permilagem: 100, ownerId: adminAurora.id },
    { identifier: "R/C Dto", floor: 0, typology: "T1", permilagem: 100, ownerId: joao.id, tenantId: ana.id },
    { identifier: "1.º Esq", floor: 1, typology: "T2", permilagem: 200, ownerId: joao.id },
    { identifier: "1.º Dto", floor: 1, typology: "T2", permilagem: 200, ownerId: maria.id },
    { identifier: "2.º Esq", floor: 2, typology: "T3", permilagem: 250, ownerId: carlos.id },
    { identifier: "2.º Dto", floor: 2, typology: "T2", permilagem: 150, ownerId: carlos.id },
  ];

  const auroraUnits = [];
  for (const u of auroraUnitData) {
    const unit = await db.unit.create({ data: { condominiumId: aurora.id, ...u } });
    auroraUnits.push(unit);
  }

  console.log("  Created 6 Aurora units (permilagem: 1000).");

  // Jardim: 4 units, permilagem totals 1000
  const jardimUnitData = [
    { identifier: "Fração A", floor: 0, typology: "T2", permilagem: 250, ownerId: joao.id },
    { identifier: "Fração B", floor: 0, typology: "T2", permilagem: 250, ownerId: sofia.id, tenantId: tiago.id },
    { identifier: "Fração C", floor: 1, typology: "T3", permilagem: 300, ownerId: ricardo.id },
    { identifier: "Fração D", floor: 1, typology: "T1", permilagem: 200, ownerId: beatriz.id },
  ];

  const jardimUnits = [];
  for (const u of jardimUnitData) {
    const unit = await db.unit.create({ data: { condominiumId: jardim.id, ...u } });
    jardimUnits.push(unit);
  }

  console.log("  Created 4 Jardim units (permilagem: 1000).");

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 5: Suppliers
  // ═══════════════════════════════════════════════════════════════════════════

  // Aurora suppliers
  const auroraLimpeza = await db.supplier.create({
    data: {
      condominiumId: aurora.id, name: "LimpaTudo Lda.", nif: "509876543",
      phone: "210123456", email: "geral@limpatudo.pt", category: "Limpeza",
    },
  });

  const auroraElevador = await db.supplier.create({
    data: {
      condominiumId: aurora.id, name: "ElevaPro S.A.", nif: "504321987",
      phone: "210654321", email: "contratos@elevapro.pt", category: "Elevadores",
    },
  });

  // Jardim suppliers
  const jardimLimpeza = await db.supplier.create({
    data: {
      condominiumId: jardim.id, name: "Porto Limpo Lda.", nif: "508765432",
      phone: "220112233", email: "info@portolimpo.pt", category: "Limpeza",
    },
  });

  const jardimManutencao = await db.supplier.create({
    data: {
      condominiumId: jardim.id, name: "ManutençãoNorte S.A.", nif: "507654321",
      phone: "220334455", email: "geral@manutencaonorte.pt", category: "Manutenção Geral",
    },
  });

  console.log("  Created 4 suppliers (2 per condo).");

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 6: Budgets + Budget Items (2025 & 2026 × 2 condos)
  // ═══════════════════════════════════════════════════════════════════════════

  // Aurora 2025 — approved, €20,000
  const auroraBudget2025 = await db.budget.create({
    data: {
      condominiumId: aurora.id, year: 2025, status: "APPROVED",
      totalAmount: 20000, reserveFundPercentage: 10, approvedAt: new Date("2024-12-10"),
    },
  });

  const ab25Items = await Promise.all([
    db.budgetItem.create({ data: { budgetId: auroraBudget2025.id, category: "Limpeza", description: "Limpeza semanal das áreas comuns", plannedAmount: 6000 } }),
    db.budgetItem.create({ data: { budgetId: auroraBudget2025.id, category: "Elevador", description: "Manutenção mensal do elevador", plannedAmount: 4000 } }),
    db.budgetItem.create({ data: { budgetId: auroraBudget2025.id, category: "Electricidade", description: "Electricidade das áreas comuns", plannedAmount: 3000 } }),
    db.budgetItem.create({ data: { budgetId: auroraBudget2025.id, category: "Seguro", description: "Seguro multirriscos", plannedAmount: 1800 } }),
    db.budgetItem.create({ data: { budgetId: auroraBudget2025.id, category: "Fundo de Reserva", description: "10% do orçamento anual", plannedAmount: 2000 } }),
  ]);

  // Aurora 2026 — approved, €24,000
  const auroraBudget2026 = await db.budget.create({
    data: {
      condominiumId: aurora.id, year: 2026, status: "APPROVED",
      totalAmount: 24000, reserveFundPercentage: 10, approvedAt: new Date("2025-12-15"),
    },
  });

  const ab26Items = await Promise.all([
    db.budgetItem.create({ data: { budgetId: auroraBudget2026.id, category: "Limpeza", description: "Limpeza semanal das áreas comuns", plannedAmount: 7200 } }),
    db.budgetItem.create({ data: { budgetId: auroraBudget2026.id, category: "Elevador", description: "Manutenção mensal do elevador", plannedAmount: 4800 } }),
    db.budgetItem.create({ data: { budgetId: auroraBudget2026.id, category: "Electricidade", description: "Electricidade das áreas comuns", plannedAmount: 3600 } }),
    db.budgetItem.create({ data: { budgetId: auroraBudget2026.id, category: "Fundo de Reserva", description: "10% do orçamento anual", plannedAmount: 2400 } }),
  ]);

  // Jardim 2025 — approved, €14,400
  const jardimBudget2025 = await db.budget.create({
    data: {
      condominiumId: jardim.id, year: 2025, status: "APPROVED",
      totalAmount: 14400, reserveFundPercentage: 10, approvedAt: new Date("2024-12-18"),
    },
  });

  const jb25Items = await Promise.all([
    db.budgetItem.create({ data: { budgetId: jardimBudget2025.id, category: "Limpeza", description: "Limpeza bisemanal", plannedAmount: 4800 } }),
    db.budgetItem.create({ data: { budgetId: jardimBudget2025.id, category: "Manutenção Geral", description: "Manutenção áreas comuns e jardim", plannedAmount: 3600 } }),
    db.budgetItem.create({ data: { budgetId: jardimBudget2025.id, category: "Electricidade", description: "Electricidade partes comuns", plannedAmount: 2400 } }),
    db.budgetItem.create({ data: { budgetId: jardimBudget2025.id, category: "Fundo de Reserva", description: "10% do orçamento anual", plannedAmount: 1440 } }),
  ]);

  // Jardim 2026 — approved, €16,800
  const jardimBudget2026 = await db.budget.create({
    data: {
      condominiumId: jardim.id, year: 2026, status: "APPROVED",
      totalAmount: 16800, reserveFundPercentage: 10, approvedAt: new Date("2025-12-20"),
    },
  });

  const jb26Items = await Promise.all([
    db.budgetItem.create({ data: { budgetId: jardimBudget2026.id, category: "Limpeza", description: "Limpeza bisemanal", plannedAmount: 5400 } }),
    db.budgetItem.create({ data: { budgetId: jardimBudget2026.id, category: "Manutenção Geral", description: "Manutenção áreas comuns e jardim", plannedAmount: 4200 } }),
    db.budgetItem.create({ data: { budgetId: jardimBudget2026.id, category: "Electricidade", description: "Electricidade partes comuns", plannedAmount: 2800 } }),
    db.budgetItem.create({ data: { budgetId: jardimBudget2026.id, category: "Fundo de Reserva", description: "10% do orçamento anual", plannedAmount: 1680 } }),
  ]);

  console.log("  Created 4 budgets (2025+2026 × 2 condos) with budget items.");

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 7: Quotas (2025 & 2026 × both condos) + Transactions for paid quotas
  // ═══════════════════════════════════════════════════════════════════════════

  // Helper to generate quotas for a condo/year
  async function generateQuotas(
    condoId: string, units: { id: string; permilagem: number; identifier: string }[],
    year: number, annualTotal: number, today: Date,
  ) {
    const monthlyTotal = annualTotal / 12;
    const paidQuotas: { id: string; amount: number; paymentDate: Date; unitIdentifier: string; period: string }[] = [];
    const methods = ["TRANSFERENCIA", "MBWAY", "MULTIBANCO"] as const;
    let count = 0;

    for (let month = 1; month <= 12; month++) {
      const period = `${year}-${String(month).padStart(2, "0")}`;
      const dueDate = new Date(year, month - 1, 8);
      const monthDate = new Date(year, month - 1, 1);

      for (const unit of units) {
        const amount = Math.round((unit.permilagem / 1000) * monthlyTotal * 100) / 100;

        let status: "PAID" | "PENDING" | "OVERDUE";
        let paymentDate: Date | null = null;
        let paymentMethod: typeof methods[number] | null = null;

        if (monthDate < today) {
          // Past month
          const monthsAgo = (today.getFullYear() - year) * 12 + (today.getMonth() - (month - 1));
          if (monthsAgo > 3) {
            // Older than 3 months ago — almost all paid, occasional overdue
            status = (unit.permilagem <= 100 && month % 7 === 0) ? "OVERDUE" : "PAID";
          } else {
            // Recent 1-3 months — mix
            status = (unit.permilagem >= 200) ? "PAID" : (month % 2 === 0 ? "PAID" : "PENDING");
          }
        } else {
          // Future month
          status = "PENDING";
        }

        if (status === "PAID") {
          paymentDate = new Date(year, month - 1, 3 + (count % 5));
          paymentMethod = methods[count % 3];
        }
        if (status === "PENDING" && dueDate < today) {
          status = "OVERDUE";
        }

        const quota = await db.quota.create({
          data: { condominiumId: condoId, unitId: unit.id, period, amount, dueDate, status, paymentDate, paymentMethod },
        });
        count++;

        if (status === "PAID" && paymentDate) {
          paidQuotas.push({ id: quota.id, amount, paymentDate, unitIdentifier: unit.identifier, period });
        }
      }
    }
    return { count, paidQuotas };
  }

  const today = new Date("2026-03-31");

  // Aurora quotas
  const aq2025 = await generateQuotas(aurora.id, auroraUnits, 2025, 20000, today);
  const aq2026 = await generateQuotas(aurora.id, auroraUnits, 2026, 24000, today);
  console.log(`  Created ${aq2025.count + aq2026.count} Aurora quotas (2025+2026).`);

  // Jardim quotas
  const jq2025 = await generateQuotas(jardim.id, jardimUnits, 2025, 14400, today);
  const jq2026 = await generateQuotas(jardim.id, jardimUnits, 2026, 16800, today);
  console.log(`  Created ${jq2025.count + jq2026.count} Jardim quotas (2025+2026).`);

  // Create transactions for all paid quotas
  const allPaidQuotas = [...aq2025.paidQuotas, ...aq2026.paidQuotas, ...jq2025.paidQuotas, ...jq2026.paidQuotas];
  for (const q of allPaidQuotas) {
    const condoId = aq2025.paidQuotas.includes(q) || aq2026.paidQuotas.includes(q) ? aurora.id : jardim.id;
    await db.transaction.create({
      data: {
        condominiumId: condoId, date: q.paymentDate, amount: q.amount,
        type: "QUOTA_PAYMENT", description: `Quota ${q.period} — ${q.unitIdentifier}`, quotaId: q.id,
      },
    });
  }
  console.log(`  Created ${allPaidQuotas.length} quota payment transactions.`);

  // PLACEHOLDER — Part 8 will replace this line
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
