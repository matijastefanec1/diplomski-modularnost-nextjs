import { expect, test } from "@playwright/test";

import {
  createPlayerAccount,
  fillSignUpForm,
  signOutPlayer,
  signUpPlayer,
  submitSignUpForm,
} from "./support/player-account";
import { collectRuntimeErrors } from "./support/runtime-errors";

const expectedPageContent = [
  "Registracija",
  "Otvori račun i kreni skupljati bodove.",
  "Ime",
  "E-mail adresa",
  "Lozinka",
  "Najmanje 8 znakova, barem jedno slovo i jedna znamenka.",
  "Potvrda lozinke",
  "Registriraj se",
  "Već imaš račun? Prijavi se",
].join(" ");

const PASSWORD_LENGTH_MESSAGE = "Lozinka mora imati od 8 do 64 znaka.";
const EMAIL_TAKEN_MESSAGE = "Igrač s ovom e-mail adresom već postoji.";

test("renders the sign-up contract", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);

  const response = await page.goto("/sign-up");

  expect(response?.ok()).toBe(true);
  await expect(page.getByTestId("sign-up-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Registracija" }),
  ).toBeVisible();
  await expect(page.getByTestId("page-content")).toHaveText(
    expectedPageContent,
    { useInnerText: true },
  );

  expect(runtimeErrors).toEqual([]);
});

test("rejects a password shorter than the specification allows", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const account = { ...createPlayerAccount(), password: "kra1" };

  await page.goto("/sign-up");
  await fillSignUpForm(page, account);
  await submitSignUpForm(page);

  await expect(page.getByText(PASSWORD_LENGTH_MESSAGE)).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up$/u);
  await expect(page.getByTestId("user-menu")).toHaveCount(0);

  expect(runtimeErrors).toEqual([]);
});

test("rejects an e-mail that already belongs to a player", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const account = createPlayerAccount();

  await signUpPlayer(page, account);
  await signOutPlayer(page);

  await page.goto("/sign-up");
  await fillSignUpForm(page, account);
  await submitSignUpForm(page);

  await expect(page.getByText(EMAIL_TAKEN_MESSAGE)).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up$/u);
  await expect(page.getByTestId("user-menu")).toHaveCount(0);

  expect(runtimeErrors).toEqual([]);
});
