import type { PlayerRepository } from "../ports/player-repository";
import type { PasswordHasher } from "../ports/password-hasher";
import type { PlayerIdentity } from "../../domain/player/player";
import { normalizeEmail } from "../../domain/player/normalization";

export type VerifyCredentialsInput = {
  email: string;
  password: string;
};

export class VerifyCredentials {
  constructor(
    private readonly players: PlayerRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: VerifyCredentialsInput): Promise<PlayerIdentity | null> {
    const player = await this.players.findCredentialsByEmail(
      normalizeEmail(input.email),
    );

    if (!player) {
      return null;
    }

    const passwordMatches = await this.passwordHasher.verify(
      input.password,
      player.passwordHash,
    );

    if (!passwordMatches) {
      return null;
    }

    return { id: player.id, name: player.name };
  }
}
