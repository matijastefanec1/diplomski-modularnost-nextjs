import type {
  NewPlayer,
  PlayerIdentity,
  PlayerCredentials,
  PlayerStanding,
} from "../../domain/player/player";

export interface PlayerRepository {
  findCredentialsByEmail(email: string): Promise<PlayerCredentials | null>;

  create(player: NewPlayer): Promise<PlayerIdentity>;

  findStandingById(playerId: string): Promise<PlayerStanding | null>;

  listStandings(): Promise<PlayerStanding[]>;

  listIdentitiesExcept(excludedPlayerId: string): Promise<PlayerIdentity[]>;

  findExistingIds(playerIds: readonly string[]): Promise<string[]>;
}
