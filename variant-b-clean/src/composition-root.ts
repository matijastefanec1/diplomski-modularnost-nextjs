import { PrismaPlayerRepository } from "./infrastructure/persistence/prisma-player-repository";
import { PrismaMatchRepository } from "./infrastructure/persistence/prisma-match-repository";
import { PrismaUnitOfWork } from "./infrastructure/persistence/prisma-unit-of-work";
import { PrismaDatabaseHealth } from "./infrastructure/persistence/prisma-database-health";
import { BcryptPasswordHasher } from "./infrastructure/security/bcrypt-password-hasher";
import { SystemClock } from "./infrastructure/time/system-clock";
import { createAuth } from "./infrastructure/auth/create-auth";
import { RegisterPlayer } from "./application/use-cases/register-player";
import { VerifyCredentials } from "./application/use-cases/verify-credentials";
import { GetPlayerProfile } from "./application/use-cases/get-player-profile";
import { GetLeaderboard } from "./application/use-cases/get-leaderboard";
import { ListSelectablePlayers } from "./application/use-cases/list-selectable-players";
import { RecordMatch } from "./application/use-cases/record-match";
import { GetMatchDetails } from "./application/use-cases/get-match-details";
import { GetPlayerMatchHistory } from "./application/use-cases/get-player-match-history";
import { DecideMatch } from "./application/use-cases/decide-match";
import { ConfirmMatch } from "./application/use-cases/confirm-match";
import { DisputeMatch } from "./application/use-cases/dispute-match";
import { CheckDatabaseConnection } from "./application/use-cases/check-database-connection";

// korijen stoji izvan 4 sloja, smije uvoziti i application i infrastructure,
// a presentation ga smije uvesti. Spajanje adaptera s use-caseovima
export function createCompositionRoot() {
  const databaseHealth = new PrismaDatabaseHealth();
  const players = new PrismaPlayerRepository();
  const matches = new PrismaMatchRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const clock = new SystemClock();
  const unitOfWork = new PrismaUnitOfWork();
  const decideMatch = new DecideMatch(matches, unitOfWork, clock);

  return {
    registerPlayer: new RegisterPlayer(players, passwordHasher),
    verifyCredentials: new VerifyCredentials(players, passwordHasher),
    getPlayerProfile: new GetPlayerProfile(players),
    getLeaderboard: new GetLeaderboard(players),
    listSelectablePlayers: new ListSelectablePlayers(players),
    recordMatch: new RecordMatch(matches, players),
    getMatchDetails: new GetMatchDetails(matches, clock),
    getPlayerMatchHistory: new GetPlayerMatchHistory(matches, clock),
    confirmMatch: new ConfirmMatch(decideMatch),
    disputeMatch: new DisputeMatch(decideMatch),
    checkDatabaseConnection: new CheckDatabaseConnection(databaseHealth),
  } as const;
}

const application = createCompositionRoot();

export const {
  registerPlayer,
  getPlayerProfile,
  getLeaderboard,
  listSelectablePlayers,
  recordMatch,
  getMatchDetails,
  getPlayerMatchHistory,
  confirmMatch,
  disputeMatch,
} = application;

export const { handlers, auth, signIn, signOut } = createAuth(
  application.verifyCredentials,
);
