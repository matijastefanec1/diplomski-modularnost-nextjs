const ACTIVITY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const activityWindowStart = (now: Date): Date => {
  return new Date(now.getTime() - ACTIVITY_WINDOW_MS);
};
