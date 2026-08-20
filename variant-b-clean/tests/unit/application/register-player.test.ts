import { describe, beforeEach, it, expect } from "vitest";

import { RegisterPlayer } from "@/src/application/use-cases/register-player";

import {
  InMemoryPlayerRepository,
  ReversingPasswordHasher,
} from "../../support/player-doubles";

let players: InMemoryPlayerRepository;
let registerPlayer: RegisterPlayer;

beforeEach(() => {
  players = new InMemoryPlayerRepository();
  registerPlayer = new RegisterPlayer(players, new ReversingPasswordHasher());
});

describe("RegisterPlayer", () => {
  it("stores the normalized name and e-mail", async () => {
    const result = await registerPlayer.execute({
      name: "  Ana   Anić  ",
      email: " Ana.Anic@Mail.COM ",
      password: "lozinka1",
    });

    expect(result).toEqual({
      status: "registered",
      player: { id: "player-1", name: "Ana Anić" },
    });
    expect(players.stored[0]).toMatchObject({
      name: "Ana Anić",
      email: "ana.anic@mail.com",
    });
  });

  it("stores the password only as a hash and never normalizes it", async () => {
    await registerPlayer.execute({
      name: "Ana Anić",
      email: "ana@mail.com",
      password: "  Lozinka1  ",
    });

    expect(players.stored[0].passwordHash).toBe("  1aknizoL  ");
    expect(players.stored[0]).not.toHaveProperty("password");
  });

  it("reports a taken e-mail instead of throwing", async () => {
    const input = {
      name: "Ana Anić",
      email: "ana@mail.com",
      password: "lozinka1",
    };

    await registerPlayer.execute(input);

    const result = await registerPlayer.execute({
      ...input,
      name: "Test Testić",
    });

    expect(result).toEqual({ status: "email-taken" });
    expect(players.stored).toHaveLength(1);
  });

  it("detects a taken e-mail that differs only in case or spacing", async () => {
    await registerPlayer.execute({
      name: "Ana Anić",
      email: "ana@mail.com",
      password: "lozinka1",
    });

    const result = await registerPlayer.execute({
      name: "Test Testić",
      email: "  ANA@Mail.com ",
      password: "lozinka2",
    });

    expect(result).toEqual({ status: "email-taken" });
  });
});
