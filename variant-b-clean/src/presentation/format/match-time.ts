const ZAGREB_TIME_ZONE = "Europe/Zagreb";
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

const zagrebDate = new Intl.DateTimeFormat("en-US", {
  timeZone: ZAGREB_TIME_ZONE,
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

const zagrebTime = new Intl.DateTimeFormat("en-US", {
  timeZone: ZAGREB_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getParts(
  formatter: Intl.DateTimeFormat,
  date: Date,
): Record<string, string> {
  const parts: Record<string, string> = {};

  for (const part of formatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }

  return parts;
}

export function formatDateTime(date: Date): string {
  const day = getParts(zagrebDate, date);
  const time = getParts(zagrebTime, date);
  return `${day.day}.${day.month}.${day.year}. u ${time.hour}:${time.minute}`;
}

export function formatRemainingTime(deadline: Date, now: Date): string | null {
  const remainingMs = deadline.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return null;
  }

  if (remainingMs >= HOUR_MS) {
    return `${Math.round(remainingMs / HOUR_MS)} h`;
  }

  return `${Math.max(1, Math.floor(remainingMs / MINUTE_MS))} min`;
}
