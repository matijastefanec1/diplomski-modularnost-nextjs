import type { DatabaseHealthPort } from "@/src/application/ports/database-health-port";

import { prisma } from "./prisma";

export class PrismaDatabaseHealth implements DatabaseHealthPort {
  async isAvailable() {
    const rows = await prisma.$queryRaw<Array<{ result: number }>>`
      SELECT 1 AS result
    `;

    return rows[0]?.result === 1;
  }
}
