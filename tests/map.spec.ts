import { test, expect } from '@playwright/test';

test.describe('Map Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the map to load
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    // Wait a bit more for map tiles to load
    await page.waitForTimeout(2000);
  });

  test('should load the map successfully', async ({ page }) => {
    // Check if map container exists
    const mapContainer = page.locator('.maplibregl-map');
    await expect(mapContainer).toBeVisible();

    // Check if navigation controls are visible
    const navControls = page.locator('.maplibregl-ctrl-group');
    await expect(navControls).toBeVisible();
  });

  test('should display sidebar with controls', async ({ page }) => {
    // Check sidebar is visible
    const sidebar = page.locator('text=Define Area of Interest').first();
    await expect(sidebar).toBeVisible();

    // Check for drawing button
    const drawButton = page.locator('button:has-text("Start Drawing")');
    await expect(drawButton).toBeVisible();

    // Check for search input
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should enable drawing mode when Start Drawing is clicked', async ({ page }) => {
    const drawButton = page.locator('button:has-text("Start Drawing")');
    await drawButton.click();

    // Check that button text changes
    await expect(page.locator('button:has-text("Drawing...")')).toBeVisible();

    // Check that Stop button appears
    await expect(page.locator('button:has-text("Stop")')).toBeVisible();
  });

  test('should disable drawing mode when Stop is clicked', async ({ page }) => {
    // Start drawing
    await page.locator('button:has-text("Start Drawing")').click();
    await page.waitForTimeout(500);

    // Stop drawing
    await page.locator('button:has-text("Stop")').click();
    await page.waitForTimeout(500);

    // Check that Start Drawing button is back
    await expect(page.locator('button:has-text("Start Drawing")')).toBeVisible();
  });

  test('should create a polygon when drawing on map', async ({ page }) => {
    // Start drawing mode
    await page.locator('button:has-text("Start Drawing")').click();
    await page.waitForTimeout(1000);

    // Get map bounds to click within the map
    const mapContainer = page.locator('.maplibregl-map');
    const boundingBox = await mapContainer.boundingBox();
    
    if (boundingBox) {
      // Click to start drawing (first point)
      await page.mouse.click(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2
      );
      await page.waitForTimeout(500);

      // Click second point
      await page.mouse.click(
        boundingBox.x + boundingBox.width / 2 + 100,
        boundingBox.y + boundingBox.height / 2
      );
      await page.waitForTimeout(500);

      // Click third point
      await page.mouse.click(
        boundingBox.x + boundingBox.width / 2 + 100,
        boundingBox.y + boundingBox.height / 2 + 100
      );
      await page.waitForTimeout(500);

      // Click fourth point
      await page.mouse.click(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2 + 100
      );
      await page.waitForTimeout(500);

      // Double-click to finish polygon
      await page.mouse.dblclick(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2
      );
      await page.waitForTimeout(1000);

      // Check for success message
      const successMessage = page.locator('text=Polygon drawn successfully');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show Apply button when polygon is drawn', async ({ page }) => {
    // Draw a polygon first (simplified version)
    await page.locator('button:has-text("Start Drawing")').click();
    await page.waitForTimeout(500);

    const mapContainer = page.locator('.maplibregl-map');
    const boundingBox = await mapContainer.boundingBox();
    
    if (boundingBox) {
      const centerX = boundingBox.x + boundingBox.width / 2;
      const centerY = boundingBox.y + boundingBox.height / 2;

      // Create a simple triangle
      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 50, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 50, centerY + 50);
      await page.waitForTimeout(300);
      await page.mouse.dblclick(centerX, centerY);
      await page.waitForTimeout(1000);

      // Check Apply button is enabled
      const applyButton = page.locator('button:has-text("Apply outline")');
      await expect(applyButton).toBeEnabled({ timeout: 5000 });
    }
  });

  test('should allow clearing all polygons', async ({ page }) => {
    const clearButton = page.locator('button:has-text("Clear All Polygons")');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await page.waitForTimeout(500);
  });

  test('should display instructions in sidebar', async ({ page }) => {
    const instructions = page.locator('text=Instructions');
    await expect(instructions).toBeVisible();

    // Check for instruction items
    await expect(page.locator('text=Search for a location')).toBeVisible();
    await expect(page.locator('text=Click "Start Drawing"')).toBeVisible();
  });
});

test.describe('Map Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should allow panning the map', async ({ page }) => {
    const mapContainer = page.locator('.maplibregl-map');
    const boundingBox = await mapContainer.boundingBox();
    
    if (boundingBox) {
      const startX = boundingBox.x + boundingBox.width / 2;
      const startY = boundingBox.y + boundingBox.height / 2;

      // Drag to pan
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 100, startY + 100);
      await page.mouse.up();
      await page.waitForTimeout(1000);
    }
  });

  test('should allow zooming with controls', async ({ page }) => {
    const zoomInButton = page.locator('.maplibregl-ctrl-zoom-in');
    const zoomOutButton = page.locator('.maplibregl-ctrl-zoom-out');

    if (await zoomInButton.count() > 0) {
      await zoomInButton.click();
      await page.waitForTimeout(1000);
    }

    if (await zoomOutButton.count() > 0) {
      await zoomOutButton.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should have search input field', async ({ page }) => {
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    // Check placeholder or label
    const searchLabel = page.locator('text=Search Location');
    await expect(searchLabel).toBeVisible();
  });

  test('should allow typing in search field', async ({ page }) => {
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Berlin');
    await page.waitForTimeout(500);
    
    // Check that input value is set
    await expect(searchInput).toHaveValue('Berlin');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    
    // Check that map is visible
    const mapContainer = page.locator('.maplibregl-map');
    await expect(mapContainer).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    
    const mapContainer = page.locator('.maplibregl-map');
    await expect(mapContainer).toBeVisible();
  });
});


