-- The initial constraint allowed partial point audits because SQL CHECK
-- constraints accept UNKNOWN. Keep the nullable pre-scoring state, but make
-- the populated branch explicitly require all three values.
BEGIN;

ALTER TABLE "match_participants"
DROP CONSTRAINT "match_participants_points_check";

ALTER TABLE "match_participants"
ADD CONSTRAINT "match_participants_points_check" CHECK (
  (
    "base_points" IS NULL
    AND "activity_bonus" IS NULL
    AND "total_points" IS NULL
  )
  OR (
    "base_points" IS NOT NULL
    AND "activity_bonus" IS NOT NULL
    AND "total_points" IS NOT NULL
    AND "base_points" >= 0
    AND "activity_bonus" >= 0
    AND "total_points" >= 0
    AND "total_points" = "base_points" + "activity_bonus"
  )
);

COMMIT;
