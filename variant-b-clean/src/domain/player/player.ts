export type PlayerIdentity = {
  id: string;
  name: string;
};

export type PlayerCredentials = PlayerIdentity & {
  passwordHash: string;
};

export type PlayerStanding = PlayerIdentity & {
  points: number;
  scoredMatchCount: number;
  rank: number;
};

export type NewPlayer = {
  name: string;
  email: string;
  passwordHash: string;
};
