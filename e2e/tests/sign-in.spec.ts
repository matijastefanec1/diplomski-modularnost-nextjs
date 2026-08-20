import { expect, test } from "@playwright/test";

import {
  createPlayerAccount,
  signUpPlayer,
  submitSignInForm,
} from "./support/player-account";
import { collectRuntimeErrors } from "./support/runtime-errors";

const expectedPageContent = [
  "Prijava",
  "Prijavi se e-mail adresom i lozinkom.",
  "E-mail adresa",
  "Lozinka",
  "Prijavi se",
  "Nemaš račun? Registriraj se",
].join(" ");

const SIGN_IN_FAILED_MESSAGE = "Neispravna e-mail adresa ili lozinka.";

test("renders the sign-in contract", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);

  const response = await page.goto("/sign-in");

  expect(response?.ok()).toBe(true);
  await expect(page.getByTestId("sign-in-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Prijava" }),
  ).toBeVisible();
  await expect(page.getByTestId("page-content")).toHaveText(
    expectedPageContent,
    { useInnerText: true },
  );

  expect(runtimeErrors).toEqual([]);
});

test("answers wrong credentials with the single generic message", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const account = createPlayerAccount();

  await page.goto("/sign-in");
  await submitSignInForm(page, account);

  await expect(
    page.getByTestId("sign-in-form").getByRole("alert"),
  ).toHaveText(SIGN_IN_FAILED_MESSAGE);
  await expect(page).toHaveURL(/\/sign-in$/u);
  await expect(page.getByTestId("user-menu")).toHaveCount(0);

  expect(runtimeErrors).toEqual([]);
});

test("sends a signed-in player from sign-in to their own profile", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const account = createPlayerAccount();
  const profilePath = await signUpPlayer(page, account);

  await page.goto("/sign-in");

  await expect(page).toHaveURL(profilePath);
  await expect(page.getByTestId("player-profile-page")).toBeVisible();
  await expect(page.getByTestId("sign-in-page")).toHaveCount(0);

  expect(runtimeErrors).toEqual([]);
});
