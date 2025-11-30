# Playwright Tests

This directory contains end-to-end tests for the AOI Map Application using Playwright.

## Test Files

- `map.spec.ts` - Tests for basic map functionality, UI components, and interactions
- `polygon-drawing.spec.ts` - Tests specifically for polygon drawing, editing, and persistence

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test tests/map.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

## Test Coverage

### Map Functionality
- Map loading and initialization
- Sidebar visibility and controls
- Drawing mode activation/deactivation
- Map interactions (pan, zoom)

### Polygon Drawing
- Creating polygons by clicking on map
- Polygon visibility and rendering
- Polygon persistence after page reload
- Editing and deleting polygons

### Search Functionality
- Search input field visibility
- Text input handling

### Responsive Design
- Mobile viewport compatibility
- Tablet viewport compatibility

## Configuration

Tests are configured in `playwright.config.ts`. The configuration:
- Starts the dev server automatically before tests
- Uses Chromium, Firefox, and WebKit browsers
- Includes screenshots on failure
- Has retry logic for CI environments

## Notes

- Tests wait for map to fully load before interacting
- Some tests may require manual verification due to the nature of map interactions
- Polygon drawing tests simulate mouse clicks and movements
- LocalStorage is used to persist polygons between page reloads


