import { expect, test } from "@playwright/test";

test("About page explains statuses and disclaims investment advice", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "About & Data" })).toBeVisible();
  await expect(page.getByText(/does not provide investment/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Market status" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data freshness" })).toBeVisible();
});
