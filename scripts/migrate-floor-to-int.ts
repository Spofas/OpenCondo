/**
 * One-time migration: convert `Unit.floor` from String to Int.
 *
 * Cleans up any non-numeric values (e.g. "R/C") by setting them to NULL
 * so that `pnpm db:push` can safely alter the column type to INTEGER.
 *
 * Usage:
 *   1. Pull env vars:  vercel env pull .env.local
 *   2. Run script:     pnpm tsx scripts/migrate-floor-to-int.ts
 *   3. Push schema:    pnpm db:push --accept-data-loss
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Null-out any floor values that are not pure integers (e.g. "R/C", "1.º")
  const nullified = await db.$executeRaw`
    UPDATE "Unit"
    SET "floor" = NULL
    WHERE "floor" IS NOT NULL
      AND "floor" !~ '^-?[0-9]+$'
  `;
  console.log(`Nullified ${nullified} non-integer floor value(s).`);

  // Show remaining values so the user can verify
  const remaining = await db.$queryRaw<{ floor: string | null; count: bigint }[]>`
    SELECT "floor", COUNT(*) as count
    FROM "Unit"
    GROUP BY "floor"
    ORDER BY "floor" NULLS LAST
  `;
  console.log("Floor distribution after cleanup:");
  for (const row of remaining) {
    console.log(`  floor=${JSON.stringify(row.floor)}  count=${row.count}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
