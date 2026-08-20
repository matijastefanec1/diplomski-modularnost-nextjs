import { MatchStatus } from "@/generated/prisma/client";

export const matchStatusView: Record<
  MatchStatus,
  { label: string; className: string }
> = {
  [MatchStatus.PENDING_CONFIRMATION]: {
    label: "Čeka potvrdu",
    className: "text-warning",
  },
  [MatchStatus.SCORED]: { label: "Bodovan", className: "text-success" },
  [MatchStatus.DISPUTED]: { label: "Osporen", className: "text-danger" },
  [MatchStatus.EXPIRED]: {
    label: "Istekao",
    className: "text-text-secondary",
  },
};
