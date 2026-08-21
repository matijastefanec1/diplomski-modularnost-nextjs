import { expect, test } from "@playwright/test";

import { collectRuntimeErrors } from "./support/runtime-errors";

const expectedPageContent = [
  "SplitScore",
  "Interaktivna platforma za padel zajednicu",
  "Evidentiraj 2v2 mečeve, skupljaj bodove i prati svoj napredak na javnoj rang-listi.",
  "2v2 mečevi",
  "Svaki meč igraju dva para. Sva četiri igrača registrirana su i različita.",
  "Potvrđeni rezultati",
  "Rezultat vrijedi tek kad ga potvrdi protivnička strana, u roku od 48 sati.",
  "Transparentno bodovanje",
  "Bodovi se dodjeljuju automatski, prema unaprijed poznatim pravilima, i nikad se ne oduzimaju.",
].join(" ");

test("renders the homepage contract without runtime errors", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.getByTestId("foundation-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "SplitScore" }),
  ).toBeVisible();
  await expect(page.getByTestId("page-content")).toHaveText(
    expectedPageContent,
    { useInnerText: true },
  );

  expect(runtimeErrors).toEqual([]);
});
