# API Documentation

## Overview

This application is **client-side only** with no backend API. All data persistence is handled through browser localStorage. The application makes HTTP requests to external services for map tiles and geocoding.

## External APIs Used

### 1. NRW WMS Service (Satellite Imagery)

**Base URL**: `https://www.wms.nrw.de/geobasis/wms_nw_dop`

**Type**: WMS (Web Map Service) - OGC Standard

**Purpose**: Provides satellite/drone imagery tiles for the map

**Implementation**: Handled by Leaflet's built-in `L.tileLayer.wms()` method

**Request Format**:
```
GET https://www.wms.nrw.de/geobasis/wms_nw_dop?
  SERVICE=WMS&
  VERSION=1.1.0&
  REQUEST=GetMap&
  LAYERS=nw_dop&
  STYLES=&
  FORMAT=image/jpeg&
  TRANSPARENT=false&
  WIDTH=256&
  HEIGHT=256&
  SRS=EPSG:3857&
  BBOX=<minx>,<miny>,<maxx>,<maxy>
```

**Parameters**:
- `SERVICE`: Always "WMS"
- `VERSION`: "1.1.0"
- `REQUEST`: "GetMap"
- `LAYERS`: "nw_dop" (NRW Digital Orthophoto)
- `FORMAT`: "image/jpeg"
- `SRS`: "EPSG:3857" (Web Mercator)
- `BBOX`: Bounding box coordinates (automatically calculated by Leaflet)

**Response**: JPEG image tile (256x256 pixels)

**Error Handling**: Falls back to OpenStreetMap tiles if WMS fails

---

### 2. Nominatim Geocoding API (Location Search)

**Base URL**: `https://nominatim.openstreetmap.org/search`

**Type**: REST API

**Purpose**: Provides location search and geocoding functionality

**Rate Limits**: 
- 1 request per second (free tier)
- Requires User-Agent header

**Request Format**:
```
GET https://nominatim.openstreetmap.org/search?
  q=<search_query>&
  format=json&
  limit=5&
  addressdetails=1
```

**Parameters**:
- `q` (required): Search query string
- `format`: Response format ("json")
- `limit`: Maximum number of results (default: 5)
- `addressdetails`: Include detailed address information (1 = yes)

**Headers**:
```
User-Agent: AOI-Map-App/1.0
```

**Example Request**:
```bash
curl "https://nominatim.openstreetmap.org/search?q=Berlin&format=json&limit=5&addressdetails=1" \
  -H "User-Agent: AOI-Map-App/1.0"
```

**Example Response**:
```json
[
  {
    "place_id": 123456,
    "licence": "Data © OpenStreetMap contributors",
    "osm_type": "relation",
    "osm_id": 62422,
    "boundingbox": ["52.3382448", "52.6754542", "13.0882097", "13.7611609"],
    "lat": "52.5170365",
    "lon": "13.3888599",
    "display_name": "Berlin, Germany",
    "class": "place",
    "type": "city",
    "importance": 0.9,
    "icon": "https://nominatim.openstreetmap.org/images/mapicons/poi_place_city.p.20.png"
  }
]
```

**Response Fields**:
- `place_id`: Unique identifier
- `lat`: Latitude (string)
- `lon`: Longitude (string)
- `display_name`: Human-readable location name
- `type`: Location type (city, town, village, etc.)
- `class`: Location class
- `boundingbox`: [min_lat, max_lat, min_lon, max_lon]

**Error Handling**: Returns empty array if no results found

---

## Internal Data Storage (No API)

### localStorage API

**Purpose**: Persist polygons and map state in browser

**Storage Keys**:

1. **`aoi-polygons`**
   - **Type**: JSON stringified array
   - **Value**: `Polygon[]` (GeoJSON Feature array)
   - **Example**:
     ```json
     [
       {
         "type": "Feature",
         "id": "uuid-123",
         "geometry": {
           "type": "Polygon",
           "coordinates": [[[13.388, 52.517], [13.389, 52.517], [13.389, 52.518], [13.388, 52.518], [13.388, 52.517]]]
         },
         "properties": {
           "createdAt": "2024-01-15T10:30:00Z"
         }
       }
     ]
     ```

2. **`aoi-map-state`** (optional)
   - **Type**: JSON stringified object
   - **Value**: `{ center: [lng, lat], zoom: number }`
   - **Example**:
     ```json
     {
       "center": [13.388, 52.517],
       "zoom": 14
     }
     ```

**Methods Used**:
- `localStorage.setItem(key, value)`: Save data
- `localStorage.getItem(key)`: Retrieve data
- `localStorage.removeItem(key)`: Delete data

---

## Mock API Routes (For Future Backend)

If a backend were to be implemented, the following routes would be needed:

### Polygon Management

```
GET    /api/polygons           - List all polygons
POST   /api/polygons           - Create new polygon
GET    /api/polygons/:id       - Get polygon by ID
PUT    /api/polygons/:id       - Update polygon
DELETE /api/polygons/:id       - Delete polygon
```

### User Management (Future)

```
POST   /api/auth/login         - User login
POST   /api/auth/logout        - User logout
GET    /api/auth/me            - Get current user
POST   /api/users              - Create user account
```

### Map State (Future)

```
GET    /api/map/state          - Get saved map state
PUT    /api/map/state          - Save map state
```

---

## API Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

## Rate Limiting & Best Practices

### Nominatim API
- **Rate Limit**: 1 request per second
- **Best Practice**: Debounce search queries (300ms implemented)
- **User-Agent**: Required header (identifies application)

### WMS Service
- **Rate Limit**: Not specified (public service)
- **Best Practice**: Leaflet handles tile caching automatically
- **Caching**: Browser caches tiles automatically

---

## CORS & Security

### External APIs
- **CORS**: Handled by external services
- **HTTPS**: All requests use HTTPS
- **No Authentication**: No API keys required for current implementation

### localStorage
- **Domain-Specific**: Data only accessible from same origin
- **No Encryption**: Data stored in plain text (not suitable for sensitive data)
- **Size Limit**: ~5-10MB per domain

---

## Testing APIs

### Test WMS Service
```bash
# Test WMS tile request
curl "https://www.wms.nrw.de/geobasis/wms_nw_dop?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap&LAYERS=nw_dop&FORMAT=image/jpeg&SRS=EPSG:3857&BBOX=13.0,52.0,14.0,53.0&WIDTH=256&HEIGHT=256" -o test-tile.jpg
```

### Test Nominatim API
```bash
# Test geocoding search
curl "https://nominatim.openstreetmap.org/search?q=Berlin&format=json&limit=1" \
  -H "User-Agent: AOI-Map-App/1.0"
```

---

## Summary

- **No Backend API**: Application is client-side only
- **External APIs**: WMS (map tiles) and Nominatim (geocoding)
- **Storage**: Browser localStorage (no database)
- **Future**: Would require backend API for multi-user, collaboration, and cloud storage

