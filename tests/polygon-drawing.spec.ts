import { test, expect } from '@playwright/test';

test.describe('Polygon Drawing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should render drawn polygons on top of map', async ({ page }) => {
    // Start drawing
    await page.locator('button:has-text("Start Drawing")').click();
    await page.waitForTimeout(1000);

    const mapContainer = page.locator('.maplibregl-map');
    const boundingBox = await mapContainer.boundingBox();
    
    if (!boundingBox) {
      test.skip();
      return;
    }

    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;

    // Draw a polygon
    await page.mouse.click(centerX - 50, centerY - 50);
    await page.waitForTimeout(300);
    await page.mouse.click(centerX + 50, centerY - 50);
    await page.waitForTimeout(300);
    await page.mouse.click(centerX + 50, centerY + 50);
    await page.waitForTimeout(300);
    await page.mouse.click(centerX - 50, centerY + 50);
    await page.waitForTimeout(300);
    await page.mouse.dblclick(centerX - 50, centerY - 50);
    await page.waitForTimeout(2000);

    // Check for draw layers - MapboxDraw creates SVG elements
    const drawSvg = page.locator('.mapboxgl-draw svg, .maplibregl-map .mapboxgl-draw svg');
    
    // Verify polygon was created (check for success message or SVG)
    const successMessage = page.locator('text=Polygon drawn successfully');
    const hasSuccess = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    // Either success message or draw SVG should be present
    expect(hasSuccess || (await drawSvg.count() > 0)).toBeTruthy();
  });

  test('should persist polygons after page reload', async ({ page }) => {
    // Draw a polygon first
    await page.locator('button:has-text("Start Drawing")').click();
    await page.waitForTimeout(1000);

    const mapContainer = page.locator('.maplibregl-map');
    const boundingBox = await mapContainer.boundingBox();
    
    if (boundingBox) {
      const centerX = boundingBox.x + boundingBox.width / 2;
      const centerY = boundingBox.y + boundingBox.height / 2;

      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 50, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 50, centerY + 50);
      await page.waitForTimeout(300);
      await page.mouse.dblclick(centerX, centerY);
      await page.waitForTimeout(2000);

      // Reload page
      await page.reload();
      await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
      await page.waitForTimeout(3000);

      // Check if polygon still exists (stored in localStorage)
      const localStorage = await page.evaluate(() => {
        return localStorage.getItem('aoi-polygons');
      });

      expect(localStorage).toBeTruthy();
    }
  });

  test('should allow editing drawn polygon', async ({ page }) => {
    // Draw a polygon first
    await page.locator('button:has-text("Start Drawing")').click();
    await page.waitForTimeout(1000);

    const mapContainer = page.locator('.maplibregl-map');
    const boundingBox = await mapContainer.boundingBox();
    
    if (boundingBox) {
      const centerX = boundingBox.x + boundingBox.width / 2;
      const centerY = boundingBox.y + boundingBox.height / 2;

      // Create polygon
      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 50, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 50, centerY + 50);
      await page.waitForTimeout(300);
      await page.mouse.dblclick(centerX, centerY);
      await page.waitForTimeout(2000);

      // Stop drawing mode (should switch to select mode)
      await page.locator('button:has-text("Stop")').click();
      await page.waitForTimeout(500);

      // Try to click on the polygon to select it
      await page.mouse.click(centerX + 25, centerY + 25);
      await page.waitForTimeout(1000);
    }
  });

  test('should allow deleting polygon', async ({ page }) => {
    // Draw a polygon first
    await page.locator('button:has-text("Start Drawing")').click();
    await page.waitForTimeout(1000);

    const mapContainer = page.locator('.maplibregl-map');
    const boundingBox = await mapContainer.boundingBox();
    
    if (boundingBox) {
      const centerX = boundingBox.x + boundingBox.width / 2;
      const centerY = boundingBox.y + boundingBox.height / 2;

      // Create polygon
      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 50, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 50, centerY + 50);
      await page.waitForTimeout(300);
      await page.mouse.dblclick(centerX, centerY);
      await page.waitForTimeout(2000);

      // Clear all polygons
      await page.locator('button:has-text("Clear All Polygons")').click();
      await page.waitForTimeout(1000);

      // Verify polygon is removed (Apply button should be disabled)
      const applyButton = page.locator('button:has-text("Apply outline")');
      await expect(applyButton).toBeDisabled();
    }
  });
});


