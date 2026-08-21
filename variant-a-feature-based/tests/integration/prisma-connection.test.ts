import { describe, afterAll, it, expect } from "vitest";

import { prisma } from "@/shared/lib/prisma";

describe("Prisma connection", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to the variant A database", async () => {
    const rows = await prisma.$queryRaw<Array<{ result: number }>>`
      SELECT 1 AS result
    `;

    expect(rows).toEqual([{ result: 1 }]);
  });
});
