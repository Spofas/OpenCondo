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

  // PLACEHOLDER — Part 3 will replace this line
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
