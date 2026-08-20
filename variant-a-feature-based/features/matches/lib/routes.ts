export const matchPath = (matchId: string): string => {
  return `/matches/${matchId}`;
};

export function playerProfilePath(playerId: string) {
  return `/players/${playerId}`;
}

export const RECORD_MATCH_PATH = "/matches/new";
