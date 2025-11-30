import { test, expect } from '@playwright/test';

test.describe('Polygon Drawing UI (Leaflet version)', () => {

  test('Start Drawing button is visible', async ({ page }) => {
    await page.goto('/');
    const startBtn = page.locator('button:has-text("Start Drawing")');
    await expect(startBtn).toBeVisible();
  });

  test('Start Drawing → Stop button toggle works', async ({ page }) => {
    await page.goto('/');
    
    const startBtn = page.locator('button:has-text("Start Drawing")');
    await startBtn.click();

    await expect(page.locator('button:has-text("Stop")')).toBeVisible();
  });

  test('Stop Drawing returns Start Drawing button', async ({ page }) => {
    await page.goto('/');
    
    const startBtn = page.locator('button:has-text("Start Drawing")');
    await startBtn.click();

    const stopBtn = page.locator('button:has-text("Stop")');
    await stopBtn.click();

    await expect(page.locator('button:has-text("Start Drawing")')).toBeVisible();
  });

});
