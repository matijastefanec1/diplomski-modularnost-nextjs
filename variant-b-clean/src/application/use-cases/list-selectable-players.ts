import type { PlayerIdentity } from "../../domain/player/player";
import type { PlayerRepository } from "../ports/player-repository";

export class ListSelectablePlayers {
  constructor(private readonly players: PlayerRepository) {}

  execute(reporterId: string): Promise<PlayerIdentity[]> {
    return this.players.listIdentitiesExcept(reporterId);
  }
}
