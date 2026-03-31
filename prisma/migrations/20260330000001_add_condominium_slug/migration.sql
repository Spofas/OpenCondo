-- AlterTable: add slug column as nullable first
ALTER TABLE "Condominium" ADD COLUMN "slug" TEXT;

-- Backfill: generate slugs from existing names
-- Transliterate common Portuguese characters and slugify
UPDATE "Condominium"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE(
        "name",
        'àáâãèéêìíîòóôõùúûüçñÀÁÂÃÈÉÊÌÍÎÒÓÔÕÙÚÛÜÇÑ',
        'aaaaeeeiiioooouuuucnAAAAEEEIIIOOOOUUUUCN'
      ),
      '[^a-zA-Z0-9]+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
);

-- Handle any duplicate slugs by appending the cuid suffix
WITH dupes AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY "createdAt") AS rn
  FROM "Condominium"
)
UPDATE "Condominium" c
SET slug = c.slug || '-' || SUBSTRING(c.id FROM 1 FOR 6)
FROM dupes d
WHERE c.id = d.id AND d.rn > 1;

-- Make slug NOT NULL and add unique index
ALTER TABLE "Condominium" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Condominium_slug_key" ON "Condominium"("slug");
