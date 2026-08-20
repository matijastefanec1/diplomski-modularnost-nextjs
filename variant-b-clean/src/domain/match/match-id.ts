// id je uuid stupac, Postgres bi pukao na cast umjesto da vrati 404
// domain sloj ne smije uvesti ni Zod, pa je isti uvjet ovdje ručni regex
const matchIdPattern =
  /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

export const isMatchId = (value: string): boolean => {
  return matchIdPattern.test(value);
};
