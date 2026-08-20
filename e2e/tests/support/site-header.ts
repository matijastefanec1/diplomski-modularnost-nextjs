export const anonymousNavigation = [
  { label: "SplitScore", href: "/" },
  { label: "Rang-lista", href: "/leaderboard" },
  { label: "Evidentiraj meč", href: "/matches/new" },
  { label: "Prijava", href: "/sign-in" },
];

export const anonymousHeaderText = anonymousNavigation
  .map((item) => item.label)
  .join(" ");

export const anonymousNavigationLabels = anonymousNavigation.map(
  (item) => item.label,
);
