-- Composite indexes for soft-delete queries (deletedAt filtering)
-- These optimize the auto-filter added by the Prisma soft-delete extension

-- Existing soft-delete models (Quota, Expense, Transaction)
CREATE INDEX "Quota_condominiumId_deletedAt_idx" ON "Quota"("condominiumId", "deletedAt");
CREATE INDEX "Expense_condominiumId_deletedAt_idx" ON "Expense"("condominiumId", "deletedAt");
CREATE INDEX "Transaction_condominiumId_deletedAt_idx" ON "Transaction"("condominiumId", "deletedAt");

-- Newer soft-delete models (Announcement, Document, Meeting, Contract)
CREATE INDEX "Announcement_condominiumId_deletedAt_idx" ON "Announcement"("condominiumId", "deletedAt");
CREATE INDEX "Document_condominiumId_deletedAt_idx" ON "Document"("condominiumId", "deletedAt");
CREATE INDEX "Meeting_condominiumId_deletedAt_idx" ON "Meeting"("condominiumId", "deletedAt");
CREATE INDEX "Contract_condominiumId_deletedAt_idx" ON "Contract"("condominiumId", "deletedAt");
