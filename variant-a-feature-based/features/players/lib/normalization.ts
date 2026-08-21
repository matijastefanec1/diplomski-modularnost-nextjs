export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
