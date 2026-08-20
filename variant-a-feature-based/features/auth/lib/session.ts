export type SessionPlayer = {
  id: string;
  name: string;
};

export function playerProfilePath(playerId: string): string {
  return `/players/${playerId}`;
}
