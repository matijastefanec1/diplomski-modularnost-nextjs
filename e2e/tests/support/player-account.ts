import { randomUUID } from "node:crypto";

import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { collectRuntimeErrors } from "./runtime-errors";

export type PlayerAccount = {
  name: string;
  email: string;
  password: string;
};

const PASSWORD = "lozinka123";

const PROFILE_PATH_PATTERN = /\/players\/[0-9a-f-]{36}$/u;

export function createPlayerAccount(): PlayerAccount {
  const suffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

  return {
    name: `E2E Igrac ${suffix}`,
    email: `e2e-${suffix}@splitscore.test`,
    password: PASSWORD,
  };
}

export async function fillSignUpForm(
  page: Page,
  account: PlayerAccount,
  passwordConfirmation = account.password,
): Promise<void> {
  await page.getByLabel("Ime", { exact: true }).fill(account.name);
  await page.getByLabel("E-mail adresa", { exact: true }).fill(account.email);
  await page.getByLabel("Lozinka", { exact: true }).fill(account.password);
  await page
    .getByLabel("Potvrda lozinke", { exact: true })
    .fill(passwordConfirmation);
}

export function submitSignUpForm(page: Page): Promise<void> {
  return page.getByRole("button", { name: "Registriraj se" }).click();
}

export async function signUpPlayer(
  page: Page,
  account: PlayerAccount,
): Promise<string> {
  await page.goto("/sign-up");
  await fillSignUpForm(page, account);
  await submitSignUpForm(page);
  await page.waitForURL(PROFILE_PATH_PATTERN);

  return new URL(page.url()).pathname;
}

export async function submitSignInForm(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await page
    .getByLabel("E-mail adresa", { exact: true })
    .fill(credentials.email);
  await page.getByLabel("Lozinka", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Prijavi se" }).click();
}

export async function openUserMenu(page: Page): Promise<void> {
  const userMenu = page.getByTestId("user-menu");

  await expect(userMenu).toBeVisible();
  await userMenu.locator("summary").click();
  await expect(page.getByTestId("sign-out-button")).toBeVisible();
}

export async function signOutPlayer(page: Page): Promise<void> {
  await openUserMenu(page);
  await page.getByTestId("sign-out-button").click();
  await page.waitForURL("/");
}

export type SignedInPlayer = {
  account: PlayerAccount;
  profilePath: string;
  context: BrowserContext;
  page: Page;
  runtimeErrors: string[];
};

export async function signUpPlayerInNewContext(
  browser: Browser,
  baseURL: string | undefined,
): Promise<SignedInPlayer> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const runtimeErrors = collectRuntimeErrors(page);
  const account = createPlayerAccount();
  const profilePath = await signUpPlayer(page, account);

  return { account, profilePath, context, page, runtimeErrors };
}

export function signUpPlayersInNewContexts(
  browser: Browser,
  baseURL: string | undefined,
  count: number,
): Promise<SignedInPlayer[]> {
  return Promise.all(
    Array.from({ length: count }, () =>
      signUpPlayerInNewContext(browser, baseURL),
    ),
  );
}

export async function openAnonymousPage(
  browser: Browser,
  baseURL: string | undefined,
): Promise<{ context: BrowserContext; page: Page; runtimeErrors: string[] }> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  return { context, page, runtimeErrors: collectRuntimeErrors(page) };
}

export function expectNoRuntimeErrors(
  players: readonly { runtimeErrors: string[] }[],
): void {
  for (const player of players) {
    expect(player.runtimeErrors).toEqual([]);
  }
}

export async function closeContexts(
  owners: readonly { context: BrowserContext }[],
): Promise<void> {
  await Promise.all(owners.map((owner) => owner.context.close()));
}
