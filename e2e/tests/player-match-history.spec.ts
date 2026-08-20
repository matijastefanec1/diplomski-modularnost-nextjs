import { expect, test } from "@playwright/test";

import {
  confirmButton,
  decisionMessage,
  DECISION_MESSAGES,
  disputeButton,
  MATCH_STATUS_LABELS,
  openMatchPage,
} from "./support/match-page";
import { recordMatch } from "./support/match-recording";
import {
  closeContexts,
  expectNoRuntimeErrors,
  signUpPlayersInNewContexts,
} from "./support/player-account";
import { expectEmailAbsentFromHtml } from "./support/player-profile";

const RECORDED_AT_PATTERN = String.raw`\d{1,2}\.\d{1,2}\.\d{4}\. u \d{2}:\d{2}`;

function escapeForPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
}

function historyItemPattern(item: {
  status: string;
  partners: readonly string[];
  opponents: readonly [string, string];
  sets: string;
}): RegExp {
  const [first, second] = item.opponents.map(escapeForPattern);
  const parts = [
    RECORDED_AT_PATTERN,
    escapeForPattern(item.status),
    ...item.partners.map(escapeForPattern),
    `(?:${first}\\s+${second}|${second}\\s+${first})`,
    escapeForPattern(item.sets),
  ];

  return new RegExp(`^\\s*${parts.join(String.raw`\s+`)}\\s*$`, "u");
}

test("shows every match of a profile, newest first and from its owner's side", async ({
  browser,
  baseURL,
}) => {
  test.slow();

  const players = await signUpPlayersInNewContexts(browser, baseURL, 4);
  const [reporter, partner, opponentOne, opponentTwo] = players;
  const names = {
    partner: partner.account.name,
    opponentOne: opponentOne.account.name,
    opponentTwo: opponentTwo.account.name,
  };

  const scoredPath = await recordMatch(reporter.page, names, [
    { own: "6", opponent: "4" },
    { own: "7", opponent: "5" },
  ]);

  await openMatchPage(opponentOne.page, scoredPath);
  await confirmButton(opponentOne.page).click();
  await expect(decisionMessage(opponentOne.page)).toHaveText(
    DECISION_MESSAGES.confirmed,
  );

  const disputedPath = await recordMatch(reporter.page, names, [
    { own: "6", opponent: "4" },
    { own: "7", opponent: "5" },
  ]);

  await openMatchPage(opponentOne.page, disputedPath);
  await disputeButton(opponentOne.page).click();
  await expect(decisionMessage(opponentOne.page)).toHaveText(
    DECISION_MESSAGES.disputed,
  );

  const pendingPath = await recordMatch(reporter.page, names, [
    { own: "6", opponent: "4" },
    { own: "3", opponent: "6" },
    { own: "7", opponent: "5" },
  ]);

  await opponentOne.page.goto(opponentOne.profilePath);

  const opponentItems = opponentOne.page.getByTestId("match-history-item");

  await expect(opponentItems).toHaveCount(3);
  await expect(opponentItems.nth(0)).toHaveAttribute("href", pendingPath);
  await expect(opponentItems.nth(1)).toHaveAttribute("href", disputedPath);
  await expect(opponentItems.nth(2)).toHaveAttribute("href", scoredPath);

  const asSeenByOpponent = {
    partners: [opponentTwo.account.name],
    opponents: [reporter.account.name, partner.account.name] as [string, string],
  };

  await expect(opponentItems.nth(0)).toHaveText(
    historyItemPattern({
      ...asSeenByOpponent,
      status: MATCH_STATUS_LABELS.pending,
      sets: "4:6, 6:3, 5:7",
    }),
    { useInnerText: true },
  );
  await expect(opponentItems.nth(1)).toHaveText(
    historyItemPattern({
      ...asSeenByOpponent,
      status: MATCH_STATUS_LABELS.disputed,
      sets: "4:6, 5:7",
    }),
    { useInnerText: true },
  );
  await expect(opponentItems.nth(2)).toHaveText(
    historyItemPattern({
      ...asSeenByOpponent,
      status: MATCH_STATUS_LABELS.scored,
      sets: "4:6, 5:7",
    }),
    { useInnerText: true },
  );

  for (const player of players) {
    await expectEmailAbsentFromHtml(opponentOne.page, player.account.email);
  }

  await reporter.page.goto(reporter.profilePath);

  const reporterItems = reporter.page.getByTestId("match-history-item");

  await expect(reporterItems).toHaveCount(3);
  await expect(reporterItems.nth(0)).toHaveText(
    historyItemPattern({
      status: MATCH_STATUS_LABELS.pending,
      partners: [partner.account.name],
      opponents: [opponentOne.account.name, opponentTwo.account.name],
      sets: "6:4, 3:6, 7:5",
    }),
    { useInnerText: true },
  );

  expectNoRuntimeErrors(players);
  await closeContexts(players);
});
