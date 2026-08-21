import { describe, beforeEach, it, expect } from "vitest";

import { GetPlayerProfile } from "@/src/application/use-cases/get-player-profile";

import { InMemoryPlayerRepository } from "../../support/player-doubles";

const playerId = "3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44";

const standing = {
  id: playerId,
  name: "Ana Anić",
  points: 1000,
  scoredMatchCount: 0,
  rank: 3,
};

let players: InMemoryPlayerRepository;
let getPlayerProfile: GetPlayerProfile;

beforeEach(() => {
  players = new InMemoryPlayerRepository();
  players.standings.push(standing);
  getPlayerProfile = new GetPlayerProfile(players);
});

describe("GetPlayerProfile", () => {
  it("returns the standing of the requested player", async () => {
    await expect(getPlayerProfile.execute(playerId)).resolves.toEqual(standing);
  });

  it("returns null for a uuid nobody holds", async () => {
    await expect(
      getPlayerProfile.execute("6b1c2d3e-4f50-4a61-9b72-8c93d4e5f601"),
    ).resolves.toBeNull();
  });

  it("returns null for a malformed id without querying the repository", async () => {
    await expect(getPlayerProfile.execute("nije-uuid")).resolves.toBeNull();

    expect(players.standingLookups).toBe(0);
  });

  it("never exposes an e-mail", async () => {
    const profile = await getPlayerProfile.execute(playerId);

    expect(profile).not.toHaveProperty("email");
  });
});
