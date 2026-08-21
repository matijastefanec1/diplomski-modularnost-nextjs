import { afterAll, describe, expect, it } from "vitest";

import { createCompositionRoot } from "@/src/composition-root";
import { prisma } from "@/src/infrastructure/persistence/prisma";

describe("Prisma connection", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to the variant B database through the composition root", async () => {
    const application = createCompositionRoot();

    await expect(
      application.checkDatabaseConnection.execute(),
    ).resolves.toBe(true);
  });
});
