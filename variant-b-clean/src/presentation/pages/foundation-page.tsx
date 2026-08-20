const principles = [
  {
    title: "2v2 mečevi",
    description:
      "Svaki meč igraju dva para. Sva četiri igrača registrirana su i različita.",
  },
  {
    title: "Potvrđeni rezultati",
    description:
      "Rezultat vrijedi tek kad ga potvrdi protivnička strana, u roku od 48 sati.",
  },
  {
    title: "Transparentno bodovanje",
    description:
      "Bodovi se dodjeljuju automatski, prema unaprijed poznatim pravilima, i nikad se ne oduzimaju.",
  },
];

export function FoundationPage() {
  return (
    <div data-testid="foundation-page" className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-page-title font-semibold tracking-tight">
          SplitScore
        </h1>
        <p className="font-medium text-primary">
          Interaktivna platforma za padel zajednicu
        </p>
        <p className="max-w-2xl text-text-secondary">
          Evidentiraj 2v2 mečeve, skupljaj bodove i prati svoj napredak na javnoj rang-listi.
        </p>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {principles.map((principle) => (
          <li
            key={principle.title}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface p-6 shadow-card"
          >
            <h2 className="font-semibold">{principle.title}</h2>
            <p className="text-sm text-text-secondary">
              {principle.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
