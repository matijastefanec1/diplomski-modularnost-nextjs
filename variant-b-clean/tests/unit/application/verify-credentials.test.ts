import { beforeEach, describe, expect, it } from "vitest";

import { RegisterPlayer } from "@/src/application/use-cases/register-player";
import { VerifyCredentials } from "@/src/application/use-cases/verify-credentials";

import {
  InMemoryPlayerRepository,
  ReversingPasswordHasher,
} from "../../support/player-doubles";

let players: InMemoryPlayerRepository;
let verifyCredentials: VerifyCredentials;

beforeEach(async () => {
  const passwordHasher = new ReversingPasswordHasher();

  players = new InMemoryPlayerRepository();
  verifyCredentials = new VerifyCredentials(players, passwordHasher);

  await new RegisterPlayer(players, passwordHasher).execute({
    name: "Ana Anić",
    email: "ana@mail.com",
    password: "lozinka1",
  });
});

describe("VerifyCredentials", () => {
  it("returns the player identity for matching credentials", async () => {
    await expect(
      verifyCredentials.execute({
        email: "ana@mail.com",
        password: "lozinka1",
      }),
    ).resolves.toEqual({ id: "player-1", name: "Ana Anić" });
  });

  it("normalizes the e-mail before the lookup", async () => {
    await expect(
      verifyCredentials.execute({
        email: "  ANA@Mail.COM ",
        password: "lozinka1",
      }),
    ).resolves.toEqual({ id: "player-1", name: "Ana Anić" });
  });

  it("returns null for a wrong password", async () => {
    await expect(
      verifyCredentials.execute({
        email: "ana@mail.com",
        password: "pogresna1",
      }),
    ).resolves.toBeNull();
  });

  it("returns null for an unknown e-mail", async () => {
    await expect(
      verifyCredentials.execute({
        email: "ivan@mail.com",
        password: "lozinka1",
      }),
    ).resolves.toBeNull();
  });

  it("does not normalize the password", async () => {
    await expect(
      verifyCredentials.execute({
        email: "ana@mail.com",
        password: " lozinka1 ",
      }),
    ).resolves.toBeNull();
  });

  it("never exposes the password hash", async () => {
    const player = await verifyCredentials.execute({
      email: "ana@mail.com",
      password: "lozinka1",
    });

    expect(player).not.toHaveProperty("passwordHash");
  });
});
