import type {
  TransactionalRepositories,
  UnitOfWork,
} from "@/src/application/ports/unit-of-work";

import { prisma } from "./prisma";
import { PrismaMatchRepository } from "./prisma-match-repository";

export class PrismaUnitOfWork implements UnitOfWork {
  run<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction((tx) =>
      work({ matches: new PrismaMatchRepository(tx) }),
    );
  }
}
