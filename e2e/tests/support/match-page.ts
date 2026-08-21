import { expect, type Page, type Locator } from "@playwright/test";

export const MATCH_STATUS_LABELS = {
  pending: "Čeka potvrdu",
  scored: "Bodovan",
  disputed: "Osporen",
  expired: "Istekao",
} as const;

export const DECISION_MESSAGES = {
  confirmed: "Meč je potvrđen i bodovan.",
  disputed: "Meč je osporen. Bodovi se ne dodjeljuju.",
  alreadyDecided: "O ovom meču je već odlučeno.",
  deadlinePassed: "Rok za odluku je istekao.",
  notOpponent: "Odluku o meču smije donijeti samo igrač protivničke strane.",
} as const;

export function matchStatus(page: Page): Locator {
  return page.getByTestId("match-status");
}

export function confirmButton(page: Page): Locator {
  return page.getByTestId("confirm-match-button");
}

export function disputeButton(page: Page): Locator {
  return page.getByTestId("dispute-match-button");
}

export function decisionMessage(page: Page): Locator {
  return page.getByTestId("match-decision-message");
}

export async function openMatchPage(
  page: Page,
  matchPath: string,
): Promise<void> {
  await page.goto(matchPath);

  await expect(page.getByTestId("match-decision-page")).toBeVisible();
}

export async function expectNoDecisionActions(page: Page): Promise<void> {
  await expect(confirmButton(page)).toHaveCount(0);
  await expect(disputeButton(page)).toHaveCount(0);
  await expect(decisionMessage(page)).toHaveCount(0);
}

export async function expectDecisionActions(page: Page): Promise<void> {
  await expect(confirmButton(page)).toHaveText("Potvrdi");
  await expect(disputeButton(page)).toHaveText("Ospori");
}
