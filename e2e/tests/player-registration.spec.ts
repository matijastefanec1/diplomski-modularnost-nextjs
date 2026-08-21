import { expect, test } from "@playwright/test";

import { collectRuntimeErrors } from "./support/runtime-errors";
import {
  signUpPlayer,
  createPlayerAccount,
  signOutPlayer,
} from "./support/player-account";
import {
  readPlayerSummary,
  expectEmailHidden,
  expectEmailAbsentFromHtml,
} from "./support/player-profile";
import { anonymousNavigationLabels } from "./support/site-header";

const STARTING_POINTS = 1000;

const expectedColumnLabels = [
  "Pozicija",
  "Igrač",
  "Bodovi",
  "Bodovani mečevi",
];

const expectedEmptyHistory = "Još nema mečeva Ovdje će se prikazati povijest mečeva nakon prve evidencije.";

test("registers a player whose profile agrees with the leaderboard", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const account = createPlayerAccount();

  const profilePath = await signUpPlayer(page, account);

  await expect(page.getByTestId("user-menu")).toBeVisible();
  await expect(page.getByTestId("user-menu-profile")).toHaveAttribute(
    "href",
    profilePath,
  );

  await expect(page.getByTestId("player-profile-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: account.name }),
  ).toBeVisible();

  const summary = await readPlayerSummary(page);

  expect(summary.points).toBe(STARTING_POINTS);
  expect(summary.scoredMatchCount).toBe(0);

  await expect(page.getByTestId("match-history-empty")).toHaveText(
    expectedEmptyHistory,
    { useInnerText: true },
  );
  await expectEmailHidden(page, account.email);

  await page.goto("/leaderboard");

  await expect(page.getByTestId("leaderboard-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Rang-lista" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveText(expectedColumnLabels);

  const ownRow = page
    .getByTestId("leaderboard-row")
    .filter({ has: page.locator(`a[href="${profilePath}"]`) });

  await expect(ownRow).toHaveText(
    `${summary.rank}. ${account.name} ${STARTING_POINTS} 0`,
    { useInnerText: true },
  );
  await expectEmailAbsentFromHtml(page, account.email);

  expect(runtimeErrors).toEqual([]);
});

test("signs the player out and keeps the profile public without the e-mail", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const account = createPlayerAccount();

  const profilePath = await signUpPlayer(page, account);

  await signOutPlayer(page);

  await expect(page.getByTestId("user-menu")).toHaveCount(0);
  await expect(
    page.getByTestId("site-header").getByRole("link"),
  ).toHaveText(anonymousNavigationLabels);

  await page.goto(profilePath);

  await expect(page.getByTestId("player-profile-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: account.name }),
  ).toBeVisible();
  await expectEmailAbsentFromHtml(page, account.email);

  expect(runtimeErrors).toEqual([]);
});
