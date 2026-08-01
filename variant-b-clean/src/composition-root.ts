import { CheckDatabaseConnection } from "./application/use-cases/check-database-connection";
import { PrismaDatabaseHealth } from "./infrastructure/persistence/prisma-database-health";

export function createCompositionRoot() {
  const databaseHealth = new PrismaDatabaseHealth();

  return {
    checkDatabaseConnection: new CheckDatabaseConnection(databaseHealth),
  } as const;
}
