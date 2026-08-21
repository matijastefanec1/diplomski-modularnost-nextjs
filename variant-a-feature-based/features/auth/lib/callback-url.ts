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
