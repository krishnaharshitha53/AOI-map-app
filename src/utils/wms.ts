/**
 * Builds a WMS GetMap URL for the NRW DOP (Digital Orthophoto) service
 * @param bbox - Bounding box [minX, minY, maxX, maxY]
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param srs - Spatial reference system (default: EPSG:3857)
 * @returns Complete WMS GetMap URL
 */
export function buildWMSUrl(
  bbox: [number, number, number, number],
  width: number,
  height: number,
  srs: string = 'EPSG:3857'
): string {
  const baseUrl = 'https://www.wms.nrw.de/geobasis/wms_nw_dop';
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.1.1',
    LAYERS: 'nw_dop',
    STYLES: '',
    FORMAT: 'image/jpeg',
    TRANSPARENT: 'FALSE',
    SRS: srs,
    WIDTH: width.toString(),
    HEIGHT: height.toString(),
    BBOX: `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Converts tile coordinates to Web Mercator bounding box
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @param z - Zoom level
 * @returns Bounding box in Web Mercator [minX, minY, maxX, maxY]
 */
function tileToWebMercator(x: number, y: number, z: number): [number, number, number, number] {
  const n = Math.pow(2, z);
  const EARTH_RADIUS = 6378137;
  const EARTH_CIRCUMFERENCE = 2 * Math.PI * EARTH_RADIUS;
  
  // Calculate longitude bounds
  const minLon = (x / n) * 360 - 180;
  const maxLon = ((x + 1) / n) * 360 - 180;
  
  // Convert to Web Mercator X (meters)
  const minXMerc = (minLon / 360) * EARTH_CIRCUMFERENCE;
  const maxXMerc = (maxLon / 360) * EARTH_CIRCUMFERENCE;
  
  // Calculate latitude bounds (tile Y increases downward)
  const minLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n)));
  const maxLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
  
  // Convert to Web Mercator Y (meters)
  const minYMerc = Math.log(Math.tan(Math.PI / 4 + minLatRad / 2)) * EARTH_RADIUS;
  const maxYMerc = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2)) * EARTH_RADIUS;

  return [minXMerc, minYMerc, maxXMerc, maxYMerc];
}

/**
 * WMS utility functions (legacy - now using Leaflet's built-in WMS support)
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @param z - Zoom level
 * @returns Tile URL
 */
export function getWMSTileUrl(x: number, y: number, z: number): string {
  const bbox = tileToWebMercator(x, y, z);
  // Use 256x256 tiles
  return buildWMSUrl(bbox, 256, 256, 'EPSG:3857');
}

