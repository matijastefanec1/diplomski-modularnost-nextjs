import type { DatabaseHealthPort } from "../ports/database-health-port";

export class CheckDatabaseConnection {
  constructor(private readonly databaseHealth: DatabaseHealthPort) {}

  execute() {
    return this.databaseHealth.isAvailable();
  }
}
