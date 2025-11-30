import { test, expect } from '@playwright/test';

test.describe('Map Application UI (Leaflet version)', () => {

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AOI|Map|Area/i);
  });

  test('Leaflet map container is visible', async ({ page }) => {
    await page.goto('/');
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();
  });

  test('Sidebar is visible', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside, div:has-text("AOI")').first();
    await expect(sidebar).toBeVisible();
  });

  test('Search bar is visible and accepts text', async ({ page }) => {
    await page.goto('/');
    const search = page.locator('input[type="text"]').first();
    await expect(search).toBeVisible();
    await search.fill('Berlin');
    await expect(search).toHaveValue('Berlin');
  });

});
