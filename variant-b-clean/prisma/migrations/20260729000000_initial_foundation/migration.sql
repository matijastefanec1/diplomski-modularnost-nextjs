-- CreateEnum
CREATE TYPE "match_status" AS ENUM (
  'PENDING_CONFIRMATION',
  'SCORED',
  'DISPUTED',
  'EXPIRED'
);

-- CreateEnum
CREATE TYPE "match_side" AS ENUM ('A', 'B');

-- CreateTable
CREATE TABLE "players" (
  "id" UUID NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 1000,
  "registered_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "players_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "players_points_nonnegative_check" CHECK ("points" >= 0)
);

-- CreateTable
CREATE TABLE "matches" (
  "id" UUID NOT NULL,
  "reporter_id" UUID NOT NULL,
  "status" "match_status" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ(3),
  "scored_at" TIMESTAMPTZ(3),
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "matches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "matches_status_timestamps_check" CHECK (
    (
      "status" = 'PENDING_CONFIRMATION'
      AND "resolved_at" IS NULL
      AND "scored_at" IS NULL
    )
    OR (
      "status" = 'SCORED'
      AND "resolved_at" IS NOT NULL
      AND "scored_at" IS NOT NULL
    )
    OR (
      "status" IN ('DISPUTED', 'EXPIRED')
      AND "resolved_at" IS NOT NULL
      AND "scored_at" IS NULL
    )
  )
);

-- CreateTable
CREATE TABLE "match_participants" (
  "match_id" UUID NOT NULL,
  "player_id" UUID NOT NULL,
  "side" "match_side" NOT NULL,
  "base_points" INTEGER,
  "activity_bonus" INTEGER,
  "total_points" INTEGER,

  CONSTRAINT "match_participants_pkey" PRIMARY KEY ("match_id", "player_id"),
  CONSTRAINT "match_participants_points_check" CHECK (
    (
      "base_points" IS NULL
      AND "activity_bonus" IS NULL
      AND "total_points" IS NULL
    )
    OR (
      "base_points" >= 0
      AND "activity_bonus" >= 0
      AND "total_points" >= 0
      AND "total_points" = "base_points" + "activity_bonus"
    )
  )
);

-- CreateTable
CREATE TABLE "match_sets" (
  "match_id" UUID NOT NULL,
  "set_number" INTEGER NOT NULL,
  "team_a_games" INTEGER NOT NULL,
  "team_b_games" INTEGER NOT NULL,

  CONSTRAINT "match_sets_pkey" PRIMARY KEY ("match_id", "set_number"),
  CONSTRAINT "match_sets_number_check" CHECK ("set_number" BETWEEN 1 AND 3),
  CONSTRAINT "match_sets_score_check" CHECK (
    ("team_a_games" = 6 AND "team_b_games" BETWEEN 0 AND 4)
    OR ("team_b_games" = 6 AND "team_a_games" BETWEEN 0 AND 4)
    OR ("team_a_games" = 7 AND "team_b_games" IN (5, 6))
    OR ("team_b_games" = 7 AND "team_a_games" IN (5, 6))
  )
);

-- CreateIndex
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");

-- CreateIndex
CREATE INDEX "players_ranking_idx"
ON "players"("points" DESC, "registered_at" ASC, "id" ASC);

-- CreateIndex
CREATE INDEX "matches_expiration_idx"
ON "matches"("status", "recorded_at");

-- CreateIndex
CREATE INDEX "matches_activity_idx" ON "matches"("scored_at");

-- CreateIndex
CREATE INDEX "match_participants_history_idx"
ON "match_participants"("player_id", "match_id");

-- CreateIndex
CREATE INDEX "match_participants_side_idx"
ON "match_participants"("match_id", "side");

-- AddForeignKey
ALTER TABLE "matches"
ADD CONSTRAINT "matches_reporter_id_fkey"
FOREIGN KEY ("reporter_id") REFERENCES "players"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants"
ADD CONSTRAINT "match_participants_match_id_fkey"
FOREIGN KEY ("match_id") REFERENCES "matches"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants"
ADD CONSTRAINT "match_participants_player_id_fkey"
FOREIGN KEY ("player_id") REFERENCES "players"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_sets"
ADD CONSTRAINT "match_sets_match_id_fkey"
FOREIGN KEY ("match_id") REFERENCES "matches"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
