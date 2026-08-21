import { z } from "zod";

const matchIdSchema = z.uuid();

export const isMatchId = (value: string): boolean => {
  return matchIdSchema.safeParse(value).success;
};
