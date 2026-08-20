import type { MatchStatus } from "@/src/application/match";

export const matchStatusView: Record<
  MatchStatus,
  { label: string; className: string }
> = {
  PENDING_CONFIRMATION: { label: "Čeka potvrdu", className: "text-warning" },
  SCORED: { label: "Bodovan", className: "text-success" },
  DISPUTED: { label: "Osporen", className: "text-danger" },
  EXPIRED: { label: "Istekao", className: "text-text-secondary" },
};
