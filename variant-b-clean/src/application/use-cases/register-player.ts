import type { PlayerRepository } from "../ports/player-repository";
import type { PasswordHasher } from "../ports/password-hasher";
import type { PlayerIdentity } from "../../domain/player/player";
import {
  normalizeName,
  normalizeEmail,
} from "../../domain/player/normalization";
import { EmailAlreadyTakenError } from "../errors/email-already-taken-error";

export type RegisterPlayerInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterPlayerResult =
  | { status: "registered"; player: PlayerIdentity }
  | { status: "email-taken" };

export class RegisterPlayer {
  constructor(
    private readonly players: PlayerRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterPlayerInput): Promise<RegisterPlayerResult> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const player = await this.players.create({
        name: normalizeName(input.name),
        email: normalizeEmail(input.email),
        passwordHash,
      });

      return { status: "registered", player };
    } catch (error) {
      if (error instanceof EmailAlreadyTakenError) {
        return { status: "email-taken" };
      }

      throw error;
    }
  }
}
