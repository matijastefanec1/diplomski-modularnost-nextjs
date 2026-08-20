import { expect, type Page } from "@playwright/test";

import {
  confirmButton,
  DECISION_MESSAGES,
  decisionMessage,
  openMatchPage,
} from "./match-page";
import {
  recordMatch,
  type MatchParticipantNames,
  type SetScoreInput,
} from "./match-recording";

export async function playConfirmedMatch(
  reporterPage: Page,
  confirmerPage: Page,
  names: MatchParticipantNames,
  scores: readonly SetScoreInput[],
): Promise<string> {
  const matchPath = await recordMatch(reporterPage, names, scores);

  await openMatchPage(confirmerPage, matchPath);
  await confirmButton(confirmerPage).click();
  await expect(decisionMessage(confirmerPage)).toHaveText(
    DECISION_MESSAGES.confirmed,
  );

  return matchPath;
}
