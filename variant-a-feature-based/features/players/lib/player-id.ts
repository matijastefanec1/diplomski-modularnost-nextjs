import { z } from "zod";

const playerIdSchema = z.uuid();

export function isPlayerId(value: string) {
  return playerIdSchema.safeParse(value).success;
}
