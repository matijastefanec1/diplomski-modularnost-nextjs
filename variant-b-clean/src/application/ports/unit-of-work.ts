import type { MatchRepository } from "./match-repository";

export type TransactionalRepositories = {
  readonly matches: MatchRepository;
};

export interface UnitOfWork {
  run<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T>;
}
