export function playerProfilePath(playerId: string) {
  return `/players/${playerId}`;
}

export const matchPath = (matchId: string): string => {
  return `/matches/${matchId}`;
};

export const RECORD_MATCH_PATH = "/matches/new";

export function resolveCallbackUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  // samo putanje istog origina, dvije kose crte vode na tuđu domenu
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}
