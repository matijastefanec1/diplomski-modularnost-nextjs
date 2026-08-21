import type { PlayerStanding } from "../../domain/player/player";
import { isPlayerId } from "../../domain/player/player-id";
import type { PlayerRepository } from "../ports/player-repository";

export class GetPlayerProfile {
  constructor(private readonly players: PlayerRepository) {}

  async execute(playerId: string): Promise<PlayerStanding | null> {
    if (!isPlayerId(playerId)) {
      return null;
    }

    return this.players.findStandingById(playerId);
  }
}
