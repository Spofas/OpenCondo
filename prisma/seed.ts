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

  // PLACEHOLDER — Part 6 will replace this line
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
