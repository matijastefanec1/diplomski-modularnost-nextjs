import { expect, test } from "@playwright/test";

import { collectRuntimeErrors } from "./support/runtime-errors";
import {
  anonymousHeaderText,
  anonymousNavigation,
  anonymousNavigationLabels,
} from "./support/site-header";

test("renders the shared site header contract", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);

  const header = page.getByTestId("site-header");

  await expect(header).toBeVisible();
  await expect(header).toHaveText(anonymousHeaderText, { useInnerText: true });

  const links = header.getByRole("link");

  await expect(links).toHaveText(anonymousNavigationLabels);

  const hrefs = await links.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("href")),
  );

  expect(hrefs).toEqual(anonymousNavigation.map((item) => item.href));

  expect(runtimeErrors).toEqual([]);
});
