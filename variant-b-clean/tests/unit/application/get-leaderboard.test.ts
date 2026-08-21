import { describe, beforeEach, it, expect } from "vitest";

import { GetLeaderboard } from "@/src/application/use-cases/get-leaderboard";

import { InMemoryPlayerRepository } from "../../support/player-doubles";

const standings = [
  {
    id: "3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44",
    name: "Ana Anić",
    points: 1040,
    scoredMatchCount: 2,
    rank: 1,
  },
  {
    id: "6b1c2d3e-4f50-4a61-9b72-8c93d4e5f601",
    name: "Josip Josipić",
    points: 1000,
    scoredMatchCount: 0,
    rank: 2,
  },
];

let players: InMemoryPlayerRepository;
let getLeaderboard: GetLeaderboard;

beforeEach(() => {
  players = new InMemoryPlayerRepository();
  players.standings.push(...standings);
  getLeaderboard = new GetLeaderboard(players);
});

describe("GetLeaderboard", () => {
  it("returns the ranked standings in the order the repository gives them", async () => {
    await expect(getLeaderboard.execute()).resolves.toEqual(standings);
  });

  it("returns an empty list when nobody is registered", async () => {
    await expect(
      new GetLeaderboard(new InMemoryPlayerRepository()).execute(),
    ).resolves.toEqual([]);
  });

  it("never exposes an e-mail", async () => {
    const entries = await getLeaderboard.execute();

    for (const entry of entries) {
      expect(entry).not.toHaveProperty("email");
    }
  });
});
