import { MatchStatus } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prisma";

import {
  decisionDeadlineAt,
  latestExpiredRecordedAt,
} from "../lib/decision-deadline";

// jedan meč za stranicu meča, igračevi mečevi za povijest profila tog igrača
export type ExpiryScope =
  | { readonly matchId: string }
  | { readonly playerId: string };

function scopeFilter(scope: ExpiryScope) {
  return "matchId" in scope
    ? { id: scope.matchId }
    : { participants: { some: { playerId: scope.playerId } } };
}

export async function expireDueMatches(
  scope: ExpiryScope,
  now: Date,
): Promise<number> {
  const dueMatches = await prisma.match.findMany({
    where: {
      ...scopeFilter(scope),
      status: MatchStatus.PENDING_CONFIRMATION,
      recordedAt: { lte: latestExpiredRecordedAt(now) },
    },
    select: { id: true, recordedAt: true },
  });

  let expired = 0;

  // (problem s Prismom) resolvedAt je rok tog retka, pa treba označiti jedan po jedan
  for (const match of dueMatches) {
    const { count } = await prisma.match.updateMany({
      where: { id: match.id, status: MatchStatus.PENDING_CONFIRMATION },
      data: {
        status: MatchStatus.EXPIRED,
        resolvedAt: decisionDeadlineAt(match.recordedAt),
      },
    });

    expired += count;
  }

  return expired;
}
