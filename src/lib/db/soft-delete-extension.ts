import { Prisma } from "@prisma/client";

/**
 * Models that have a `deletedAt` column and use soft-delete semantics.
 * Keep this set in sync with the Prisma schema.
 */
const SOFT_DELETE_MODELS: ReadonlySet<string> = new Set([
  "Quota",
  "Expense",
  "Transaction",
  "Announcement",
  "Document",
  "Meeting",
  "Contract",
]);

function isSoftDeleteModel(model: string | undefined): boolean {
  return !!model && SOFT_DELETE_MODELS.has(model);
}

type WhereInput = Record<string, unknown> | undefined;

/**
 * Add `deletedAt: null` to a where clause unless `deletedAt` is already
 * explicitly specified (allowing callers to opt out, e.g. for audit queries).
 */
function withDeletedAtFilter(where: WhereInput): Record<string, unknown> {
  const w = where ?? {};
  if ("deletedAt" in w) return w;
  return { ...w, deletedAt: null };
}

/**
 * Prisma Client Extension that automatically filters soft-deleted records
 * from read queries on models listed in SOFT_DELETE_MODELS.
 *
 * - findMany, findFirst, count, aggregate, groupBy: adds `deletedAt: null`
 *   to the where clause unless `deletedAt` is already specified.
 * - findUnique: post-filters — returns null if the record has a non-null
 *   deletedAt (since findUnique where clause only accepts unique fields).
 *
 * Write operations (delete/deleteMany) are NOT intercepted. Soft-delete
 * writes remain explicit: `update({ data: { deletedAt: new Date() } })`.
 *
 * To include soft-deleted records, explicitly pass `deletedAt: { not: null }`
 * or any non-null value for `deletedAt` in the where clause.
 */
export const softDeleteExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = withDeletedAtFilter(args.where as WhereInput);
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = withDeletedAtFilter(args.where as WhereInput);
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        const result = await query(args);
        if (
          isSoftDeleteModel(model) &&
          result &&
          typeof result === "object" &&
          "deletedAt" in result &&
          (result as Record<string, unknown>).deletedAt != null
        ) {
          return null;
        }
        return result;
      },
      async count({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = withDeletedAtFilter(args.where as WhereInput);
        }
        return query(args);
      },
      async aggregate({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = withDeletedAtFilter(args.where as WhereInput);
        }
        return query(args);
      },
      async groupBy({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = withDeletedAtFilter(args.where as WhereInput);
        }
        return query(args);
      },
    },
  },
});
