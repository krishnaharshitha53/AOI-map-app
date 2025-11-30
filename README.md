 # AOI Map Application

A production-quality React application for creating and managing Areas of Interest (AOI) on interactive maps using satellite/drone imagery.

## Features

- 🗺️ **Interactive Map**: Leaflet with WMS satellite imagery from NRW Geobasis
- ✏️ **Polygon Drawing**: Draw, edit, and delete polygons using Leaflet.draw (minimum 3 points, unlimited maximum)
- 🔍 **Geocoding Search**: Real-time location search using Nominatim API
- 💾 **Local Storage**: Persistent polygon storage in browser localStorage
- 🎨 **Modern UI**: Tailwind CSS styling matching Figma design
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive mapping library
- **Leaflet.draw** - Drawing tools for Leaflet
- **Zustand** - Lightweight state management


## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AOI-map-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173` (Vite default port)

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Documentation

- **[ER Diagram](./ER_DIAGRAM.md)** - Data model and entity relationships
- **[API Documentation](./API_DOCUMENTATION.md)** - External APIs and storage
- **[UI Design Notes](./UI_FIGMA_NOTES.md)** - Notes on matching Figma design

**Note**: The UI components are functional but need styling updates to match the Figma design exactly. See [UI_FIGMA_NOTES.md](./UI_FIGMA_NOTES.md) for details.

---

## Map Library Choice

### Why Leaflet?

### Why Leaflet?

**Leaflet** was chosen over alternatives (MapLibre GL JS, OpenLayers) for several reasons:

1. **Simpler Z-Index Management**: Leaflet's pane system automatically handles layer ordering, eliminating z-index issues. Draw layers are placed in the `overlayPane` (z-index: 400) which is above the `tilePane` (z-index: 200), ensuring drawn polygons always appear on top of map tiles.

2. **Built-in WMS Support**: Leaflet has native WMS layer support via `L.tileLayer.wms()`, making it much simpler to integrate WMS services compared to manual tile URL building.

3. **Mature Drawing Plugin**: Leaflet.draw is a well-maintained, stable plugin specifically designed for Leaflet with excellent documentation and community support.

4. **Simpler API**: Leaflet's API is more straightforward for common mapping tasks, reducing complexity and development time.

5. **Larger Plugin Ecosystem**: Extensive plugin ecosystem for various mapping needs.

6. **Better Browser Compatibility**: Works on older browsers without requiring WebGL support.

7. **Easier Debugging**: DOM-based rendering makes it easier to inspect and debug map elements.

**Alternatives Considered:**

- **MapLibre GL JS**: 
  - Pros: WebGL performance, modern API, vector tiles support
  - Cons: Complex z-index management, manual WMS tile URL building, WebGL requirement, steeper learning curve
  - **Decision**: Chose Leaflet for simpler implementation and automatic z-index handling

- **OpenLayers**:
  - Pros: Very powerful, extensive features
  - Cons: Larger bundle size, more complex API, overkill for this use case
  - **Decision**: Leaflet provides better balance of features and simplicity

**Tradeoffs:**
- Slightly less WebGL performance than MapLibre (but sufficient for this use case)
- DOM-based rendering instead of WebGL (more compatible, easier to debug)
- Smaller bundle than OpenLayers while still being feature-rich

### Alternatives Considered

#### MapLibre GL JS
- **Pros**: WebGL performance, modern API, vector tiles support
- **Cons**: Complex z-index management, manual WMS tile URL building, WebGL requirement, steeper learning curve
- **Decision**: Chose Leaflet for simpler implementation and automatic z-index handling

#### OpenLayers
- **Pros**: Very powerful, extensive features
- **Cons**: Larger bundle size, more complex API, overkill for this use case
- **Decision**: Leaflet provides better balance of features and simplicity

---

## Architecture Decisions

### State Management: Zustand

**Zustand** was selected for state management because:

1. **Simplicity**: Minimal boilerplate, easy to understand and maintain
2. **Performance**: No unnecessary re-renders, fine-grained subscriptions
3. **TypeScript**: Excellent TypeScript support out of the box
4. **Bundle Size**: Tiny footprint (~1KB gzipped) compared to Redux
5. **No Providers**: No need to wrap the app in providers, reducing component tree complexity

**Alternative Considered:**
- **Redux Toolkit**: More complex setup, larger bundle, overkill for this application's state needs
- **Context API**: Would cause unnecessary re-renders, no built-in performance optimizations

### Component Structure

```
src/
├── components/        # React components
│   ├── Map.tsx       # Leaflet map component
│   ├── Sidebar.tsx   # Left sidebar UI
│   └── SearchBar.tsx # Geocoding search component
├── store/            # Zustand store
│   └── useStore.ts   # Global state management
├── utils/            # Helper functions
│   ├── wms.ts        # WMS utilities (legacy, now using Leaflet's built-in WMS)
│   ├── geocoding.ts  # Nominatim API integration
│   ├── debounce.ts   # Debounce utility
│   └── storage.ts    # localStorage helpers
├── types/            # TypeScript type definitions
│   └── index.ts
└── App.tsx           # Root component
```

### WMS Integration

The application integrates with the NRW WMS service (`https://www.wms.nrw.de/geobasis/wms_nw_dop`) to display satellite imagery. Leaflet's built-in `L.tileLayer.wms()` handles all the complexity of WMS tile requests automatically.

**Implementation:**
```typescript
wmsLayer.current = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
  layers: 'nw_dop',
  format: 'image/jpeg',
  transparent: false,
  version: '1.1.0',
  crs: L.CRS.EPSG3857,
  attribution: '© NRW Geobasis',
});
```

**Benefits:**
- No manual tile coordinate conversion needed
- Automatic bounding box calculation
- Built-in error handling with OSM fallback

### Polygon Drawing Behavior

The polygon drawing tool is configured to allow **unlimited points** while maintaining a **minimum of 3 points** (required for a valid polygon).

**Features:**
- **Minimum Points**: 3 points required (polygon definition)
- **Maximum Points**: Unlimited - users can add as many points as needed
- **Completion Methods**:
  1. **Double-click** - Finishes the polygon immediately
  2. **Click first point** - Only completes if clicking very close (< 0.5m) to prevent accidental completion
  3. **Stop button** - Programmatically completes polygon if it has 3+ points

**Implementation Details:**
- Custom override of Leaflet.draw's completion logic to prevent auto-completion after 3 points
- Increased tolerance for clicking first point (0.5 meters) to allow unlimited point addition
- Users can continue adding points until they explicitly finish the polygon

## Testing Strategy

### Current Implementation

### What We Tested and Why

**E2E Tests (Playwright):**
- ✅ **Map Loading**: Ensures the map initializes correctly and WMS tiles load
- ✅ **UI Components**: Verifies sidebar, buttons, and controls are visible and functional
- ✅ **Polygon Drawing**: Tests the complete drawing workflow (start, add points, finish)
- ✅ **Polygon Management**: Tests editing, deletion, and persistence
- ✅ **Search Functionality**: Verifies geocoding search works
- ✅ **Responsive Design**: Ensures app works on different viewport sizes

**Why These Tests:**
- E2E tests cover critical user flows that would break the core functionality
- Map interactions are complex and benefit from real browser testing
- Polygon drawing is the main feature - must work correctly
- Persistence ensures user data isn't lost

### What We Would Test With More Time

1. **Unit Tests**:
   - Utility functions (WMS URL building, geocoding, storage)
   - State management actions (Zustand store)
   - Polygon geometry calculations

2. **Component Tests**:
   - Individual React components in isolation
   - User interactions (button clicks, form inputs)
   - State updates and side effects

3. **Integration Tests**:
   - Map + Drawing integration
   - Search + Map integration
   - State persistence flow

4. **Performance Tests**:
   - Map rendering with 100+ polygons
   - Search debouncing effectiveness
   - Memory leaks in long sessions

5. **Accessibility Tests**:
   - Keyboard navigation
   - Screen reader compatibility
   - ARIA label correctness

## Performance Strategy

### Handling 1000+ Polygons

**Implemented Optimizations:**

1. ✅ **Viewport-Based Rendering**: Only render polygons visible in the current viewport
   - Automatically filters polygons when dataset exceeds 100 items
   - Uses bounding box intersection checks for efficient filtering
   - Caches visible polygons to avoid redundant calculations

2. ✅ **Polygon Simplification**: Simplifies polygon geometries at lower zoom levels
   - Uses distance-based simplification algorithm
   - Tolerance increases as zoom decreases (more simplification at lower zoom)
   - Reduces rendering complexity for better performance

3. ✅ **Debounced Map Events**: Debounces map move/zoom events to prevent excessive updates
   - Map move events debounced to 150ms
   - Viewport polygon updates debounced to 300ms
   - Reduces unnecessary re-renders during panning/zooming

4. ✅ **Batch Processing**: Processes polygons in batches to avoid blocking UI
   - Processes 50 polygons at a time using `requestIdleCallback`
   - Prevents UI freezing with large datasets
   - Progressive rendering for better user experience

5. ✅ **React Memoization**: Uses `React.memo` for components to prevent unnecessary re-renders
   - Sidebar and SearchBar components are memoized
   - Reduces component re-renders when unrelated state changes

6. ✅ **Efficient State Management**: Zustand selectors prevent unnecessary subscriptions
   - Fine-grained state updates
   - Only components that need specific state subscribe to it

**Future Optimizations (for even larger datasets):**

1. **IndexedDB**: Move from localStorage to IndexedDB for larger datasets (1000+ polygons)
2. **Spatial Indexing**: Implement R-tree or quadtree for faster spatial queries
3. **Web Workers**: Offload geometry calculations to web workers
4. **Canvas Rendering**: Use canvas for polygon overlays at very high zoom levels
5. **Clustering**: Group nearby polygons at lower zoom levels

### Avoiding Unnecessary Re-renders

1. **React.memo**: Memoize components that receive stable props
2. **useMemo/useCallback**: Cache expensive computations and callback functions
3. **Zustand Selectors**: Use fine-grained selectors to subscribe only to needed state slices
4. **Map Event Optimization**: Debounce map move events to prevent excessive state updates

### Memoization Strategy

```typescript
// Example: Memoized search results
const searchResults = useMemo(
  () => processSearchResults(rawResults),
  [rawResults]
);

// Example: Memoized map callbacks
const handleMapMove = useCallback(
  debounce(() => {
    // Update state
  }, 300),
  []
);
```

### Virtualization Strategy

For large polygon lists:
- Use `react-window` or `react-virtualized` to render only visible items
- Implement spatial indexing (R-tree) for efficient polygon queries
- Use canvas rendering for polygon overlays at high zoom levels

## Production Readiness

### What's Production-Ready
- ✅ Core functionality (map, drawing, search, persistence)
- ✅ Error handling (WMS fallback, search error handling)
- ✅ Responsive design
- ✅ E2E test coverage
- ✅ TypeScript type safety
- ✅ Code organization and documentation

### What Would Be Added for Production

### 1. Error Handling & Resilience
- Retry logic for failed WMS tile requests
- Graceful degradation if map library fails to load
- User-friendly error messages and recovery options
- Network status monitoring

### 2. Testing
- ✅ E2E tests for critical user flows (Playwright) - **Implemented**
- Unit tests for utility functions (Jest/Vitest) - Would add with more time
- Component tests (React Testing Library) - Would add with more time
- Visual regression testing - Would add with more time

### 3. Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### 4. Performance Monitoring
- Web Vitals tracking
- Error tracking (Sentry)
- Performance profiling
- Bundle size analysis

### 5. Advanced Features
- Undo/redo functionality for polygon edits
- Export polygons as GeoJSON/KML
- Import polygons from files
- Polygon area calculation
- Multiple polygon layers with visibility toggles
- Polygon styling customization
- Measurement tools (distance, area)

### 6. Backend Integration
- Save polygons to database
- User authentication
- Collaborative editing
- Version history

### 7. Mobile Optimization
- Touch-optimized drawing controls
- Gesture-based navigation
- Offline map caching
- Progressive Web App (PWA) support

### 8. Code Quality
- ESLint strict rules
- Prettier code formatting
- Pre-commit hooks (Husky)
- CI/CD pipeline
- Code splitting and lazy loading

## Tradeoffs Made

1. **Leaflet vs MapLibre**: Chose Leaflet for simpler z-index management and built-in WMS support, trading some WebGL performance for easier implementation and maintenance
2. **LocalStorage vs IndexedDB**: Chose localStorage for simplicity; would upgrade to IndexedDB for production with large datasets (1000+ polygons)
3. **No Backend**: Application is client-only for simplicity; production would require backend for persistence, collaboration, and user management
4. **Basic Error Handling**: Focused on core functionality; comprehensive error handling would be added in production
5. **Polygon Drawing**: Minimum 3 points required (polygon definition), but allows unlimited points until user explicitly finishes (double-click or Stop button)
6. **WMS Fallback**: Uses OpenStreetMap as fallback if WMS fails, ensuring map always displays

## Time Spent

Approximate time breakdown:
- **Project Setup**: 30 minutes (Vite, TypeScript, Tailwind configuration)
- **State Management**: 45 minutes (Zustand store design and implementation)
- **Map Component (Initial)**: 2 hours (MapLibre integration, WMS tile conversion, drawing tools)
- **Map Component (Migration)**: 1.5 hours (Migration to Leaflet, z-index fixes, polygon drawing improvements)
- **Search Component**: 1 hour (Nominatim integration, debouncing, UI)
- **Sidebar Component**: 1 hour (UI matching Figma design)
- **Utilities & Helpers**: 1 hour (WMS utilities, storage, debounce)
- **Styling & Polish**: 1 hour (Tailwind CSS, responsive design)
- **Testing**: 1.5 hours (Playwright test setup, E2E tests)
- **Testing & Debugging**: 1 hour (fixing issues, polygon drawing behavior)
- **Documentation**: 1.5 hours (README, code comments, migration docs)

**Total: ~12 hours**

## License

MIT

## Acknowledgments

- [Leaflet](https://leafletjs.com/) - Open-source mapping library
- [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw) - Drawing plugin for Leaflet
- [NRW Geobasis](https://www.wms.nrw.de/) - WMS service provider
- [Nominatim](https://nominatim.org/) - OpenStreetMap geocoding service
- [OpenStreetMap](https://www.openstreetmap.org/) - Map tile fallback
