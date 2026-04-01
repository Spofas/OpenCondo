-- Add soft-delete (deletedAt) column to Announcement, Document, Meeting, and Contract models.
-- Nullable DateTime — NULL means the record is active, non-NULL means it was soft-deleted.

ALTER TABLE "Announcement" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Meeting" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Contract" ADD COLUMN "deletedAt" TIMESTAMP(3);
