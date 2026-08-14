import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads, renders the globe, and shows market markers", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Global Market Globe" })).toBeVisible();

    // The 3D globe renders into a <canvas> inside the labeled globe region.
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Market markers: verify via the accessible market list (keyboard-navigable
    // alternative to the WebGL canvas, which Playwright cannot introspect
    // marker-by-marker).
    await page.getByText("View markets as a list (keyboard accessible)").click();
    const marketButtons = page.getByRole("listitem").getByRole("button");
    await expect(marketButtons.first()).toBeVisible();
    expect(await marketButtons.count()).toBeGreaterThanOrEqual(15);
  });

  test("clicking a market opens the detail panel with status and data-status labels", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByText("View markets as a list (keyboard accessible)").click();

    const indiaButton = page.getByRole("button", { name: /India/ });
    await indiaButton.click();

    const panel = page.getByRole("heading", { name: "India" });
    await expect(panel).toBeVisible();

    // Market status (e.g. Open/Closed/Holiday) is shown.
    await expect(
      page.getByText(/Open|Closed|Pre-market|Post-market|Holiday|Unavailable/).first(),
    ).toBeVisible();

    // At least one instrument's data status (Demo data/Stale/Unavailable/etc) is shown.
    await expect(
      page.getByText(/Demo data|Live|Delayed|Stale|End of day|Unavailable/).first(),
    ).toBeVisible();
  });

  test("unavailable instrument values are never shown as zero", async ({ page }) => {
    await page.goto("/");
    await page.getByText("View markets as a list (keyboard accessible)").click();

    // Open every market's panel and confirm no numeric field renders as a bare "0".
    const marketButtons = page.getByRole("listitem").getByRole("button");
    const count = await marketButtons.count();
    for (let i = 0; i < count; i += 1) {
      await marketButtons.nth(i).click();
      const zeroValue = page.getByText(/^0\.00$/);
      expect(await zeroValue.count()).toBe(0);
      await page.getByRole("button", { name: "Close market details" }).click();
    }
  });

  test("close button un-locks the detail panel", async ({ page }) => {
    await page.goto("/");
    await page.getByText("View markets as a list (keyboard accessible)").click();
    await page.getByRole("button", { name: /India/ }).click();
    await expect(page.getByRole("heading", { name: "India" })).toBeVisible();

    await page.getByRole("button", { name: "Close market details" }).click();
    await expect(page.getByRole("heading", { name: "India" })).toHaveCount(0);
  });

  test("market markers are keyboard accessible", async ({ page }) => {
    await page.goto("/");
    await page.getByText("View markets as a list (keyboard accessible)").click();

    const firstMarket = page.getByRole("listitem").getByRole("button").first();
    await firstMarket.focus();
    await expect(firstMarket).toBeFocused();
    await page.keyboard.press("Enter");

    // A detail panel heading should now be visible for some market.
    await expect(page.locator("aside h2")).toBeVisible();
  });

  test("data-provider disclaimer and last-sync time are shown", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/not investment advice/i)).toBeVisible();
    await expect(page.getByText("Last synced:")).toBeVisible();
  });
});

test.describe("Mobile", () => {
  test.use({ viewport: { width: 393, height: 851 }, hasTouch: true, isMobile: true });

  test("tapping a market opens the panel on mobile", async ({ page }) => {
    await page.goto("/");
    await page.getByText("View markets as a list (keyboard accessible)").click();
    await page.getByRole("button", { name: /Japan/ }).tap();
    await expect(page.getByRole("heading", { name: "Japan" })).toBeVisible();
  });
});

test.describe("Reduced motion", () => {
  test("homepage renders without error when prefers-reduced-motion is set", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Global Market Globe" })).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
  });
});
