import type { PlayerStanding } from "../../domain/player/player";
import type { PlayerRepository } from "../ports/player-repository";

export class GetLeaderboard {
  constructor(private readonly players: PlayerRepository) {}

  async execute(): Promise<PlayerStanding[]> {
    return this.players.listStandings();
  }
}
