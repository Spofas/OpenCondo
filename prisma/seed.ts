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
  // PART 2: Users
  // ═══════════════════════════════════════════════════════════════════════════

  // PLACEHOLDER — Part 2 will replace this line
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
