import { expect, type Page } from "@playwright/test";

const SUMMARY_PATTERN =
  /Pozicija\s+(\d+)\.\s+Bodovi\s+(\d+)\s+Bodovani mečevi\s+(\d+)/u;

export type PlayerSummary = {
  rank: number;
  points: number;
  scoredMatchCount: number;
};

export async function readPlayerSummary(page: Page): Promise<PlayerSummary> {
  const summary = page.getByTestId("player-profile-page").locator("dl");

  await expect(summary).toHaveText(SUMMARY_PATTERN, { useInnerText: true });

  const text = await summary.innerText();
  const match = SUMMARY_PATTERN.exec(text);

  if (match === null) {
    throw new Error(`Profile summary does not match the contract: ${text}`);
  }

  return {
    rank: Number(match[1]),
    points: Number(match[2]),
    scoredMatchCount: Number(match[3]),
  };
}

export async function expectEmailHidden(
  page: Page,
  email: string,
): Promise<void> {
  await expect(page.getByText(email)).toHaveCount(0);
}

export async function expectEmailAbsentFromHtml(
  page: Page,
  email: string,
): Promise<void> {
  expect(await page.content()).not.toContain(email);
}
