const DECISION_WINDOW_MS = 48 * 60 * 60 * 1000;

export const decisionDeadlineAt = (recordedAt: Date): Date => {
  return new Date(recordedAt.getTime() + DECISION_WINDOW_MS);
};

// dvije funkcije jer stranica treba trenutak, a upit granicu
export const latestExpiredRecordedAt = (now: Date): Date => {
  return new Date(now.getTime() - DECISION_WINDOW_MS);
};

// meč star 48 sati je istekao
export function isDecisionWindowExpired(recordedAt: Date, now: Date): boolean {
  return now.getTime() >= decisionDeadlineAt(recordedAt).getTime();
}
