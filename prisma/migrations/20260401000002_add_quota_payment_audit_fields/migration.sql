-- AlterTable
ALTER TABLE "Quota" ADD COLUMN "recordedBy" TEXT;
ALTER TABLE "Quota" ADD COLUMN "recordedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
