-- Convert Unit.floor from TEXT to INTEGER (0 = R/C, 1 = 1.º, etc.)
-- Non-integer values (e.g. "R/C") are nullified before the type cast.

-- Step 1: Null out any non-integer floor values (e.g. "R/C", "1.º")
UPDATE "Unit"
SET "floor" = NULL
WHERE "floor" IS NOT NULL
  AND "floor" !~ '^-?[0-9]+$';

-- Step 2: Cast column type from TEXT to INTEGER
ALTER TABLE "Unit" ALTER COLUMN "floor" TYPE INTEGER USING "floor"::INTEGER;
