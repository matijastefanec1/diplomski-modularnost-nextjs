import { expect, test } from "@playwright/test";

const expectedVisibleContent = [
  "SplitScore",
  "Okaaaay, lets goooo",
].join(" ");

test("renders the shared SplitScore foundation contract without runtime errors", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      runtimeErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    runtimeErrors.push(error.message);
  });

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.getByTestId("foundation-page")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "SplitScore" }),
  ).toBeVisible();
  const visibleContent = (await page.locator("body").innerText())
    .replace(/\s+/g, " ")
    .trim();

  expect(visibleContent).toBe(expectedVisibleContent);
  expect(runtimeErrors).toEqual([]);
});
