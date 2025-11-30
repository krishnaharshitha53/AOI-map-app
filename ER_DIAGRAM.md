# Entity Relationship Diagram

## Data Model Overview

This application uses a client-side only architecture with localStorage for persistence. The data model is simple and designed for browser storage.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AOI Map Application                       │
│                    (Client-Side Only)                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      Polygon         │
│  (GeoJSON Feature)   │
├──────────────────────┤
│ - id: string         │  ┌──────────────────────┐
│ - type: "Feature"    │  │   Map State          │
│ - geometry: {         │  ├──────────────────────┤
│     type: "Polygon"  │  │ - center: [lng, lat] │
│     coordinates: []   │  │ - zoom: number      │
│   }                   │  │ - drawingMode: enum │
│ - properties: {       │  └──────────────────────┘
│     name?: string    │           │
│     area?: number    │           │
│     createdAt: date  │           │
│   }                   │           │
└──────────────────────┘           │
         │                          │
         │                          │
         │                          │
         ▼                          ▼
┌──────────────────────────────────────────┐
│         Zustand Store (useStore)          │
├──────────────────────────────────────────┤
│ - polygons: Polygon[]                    │
│ - mapCenter: [number, number]            │
│ - mapZoom: number                         │
│ - drawingMode: 'simple_select' |          │
│              'draw_polygon'               │
│ - currentPolygon: Polygon | null         │
│ - searchQuery: string                     │
│ - searchResults: NominatimResult[]       │
│ - isSearching: boolean                    │
│ - showSearchResults: boolean              │
└──────────────────────────────────────────┘
         │
         │
         ▼
┌──────────────────────────────────────────┐
│         localStorage (Browser)            │
├──────────────────────────────────────────┤
│ Key: "aoi-polygons"                      │
│ Value: Polygon[] (JSON stringified)      │
│                                           │
│ Key: "aoi-map-state"                      │
│ Value: { center, zoom } (JSON)           │
└──────────────────────────────────────────┘
```

## Data Flow

```
User Action
    │
    ▼
React Component
    │
    ▼
Zustand Store (useStore)
    │
    ├──► Update State
    │
    └──► localStorage (persist)
         │
         ▼
    Browser Storage
```

## External APIs

```
┌──────────────────────┐
│   NRW WMS Service    │
│  (Satellite Imagery) │
└──────────────────────┘
         │
         │ HTTP GET (WMS)
         │
         ▼
┌──────────────────────┐
│   Leaflet Map        │
│   (Tile Rendering)   │
└──────────────────────┘

┌──────────────────────┐
│   Nominatim API      │
│   (Geocoding)        │
└──────────────────────┘
         │
         │ HTTP GET (Search)
         │
         ▼
┌──────────────────────┐
│   SearchBar          │
│   Component          │
└──────────────────────┘
```

## Schema Details

### Polygon Entity

```typescript
interface Polygon {
  type: "Feature";
  id: string; // Generated UUID
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // [[[lng, lat], ...]]
  };
  properties: {
    name?: string;
    area?: number; // in square meters
    createdAt: string; // ISO date string
    color?: string; // hex color
  };
}
```

### Map State Entity

```typescript
interface MapState {
  center: [number, number]; // [longitude, latitude]
  zoom: number; // 0-18
  drawingMode: 'simple_select' | 'draw_polygon';
}
```

### Search State Entity

```typescript
interface SearchState {
  query: string;
  results: NominatimResult[];
  isSearching: boolean;
  showResults: boolean;
}
```

## Storage Strategy

### Current Implementation (localStorage)
- **Capacity**: ~5-10MB per domain
- **Format**: JSON stringified arrays/objects
- **Persistence**: Survives browser restarts
- **Limitations**: Synchronous, string-only, domain-specific

### Future Production Implementation (IndexedDB)
- **Capacity**: Much larger (50% of disk space)
- **Format**: Structured data with indexes
- **Persistence**: Survives browser restarts
- **Advantages**: Asynchronous, supports complex queries, better for 1000+ polygons

## Relationships

1. **One-to-Many**: Application → Polygons
   - One application instance can have many polygons
   - Polygons are stored in an array

2. **One-to-One**: Application → Map State
   - One application instance has one map state
   - Map state includes center, zoom, and drawing mode

3. **One-to-Many**: Application → Search Results
   - One application instance can have many search results
   - Results are temporary (not persisted)

## Notes

- **No Backend**: All data is stored client-side
- **No Database**: Uses browser localStorage (IndexedDB for production)
- **No User Management**: Single-user application
- **No Authentication**: No user accounts or sessions
- **No API Routes**: All API calls are to external services (WMS, Nominatim)

