/**
 * Performance utilities for handling large numbers of polygons
 */

import type { GeoJSONFeature } from '../types';
import L from 'leaflet';

/**
 * Calculate bounding box from polygon coordinates
 */
export function getBoundingBox(coordinates: number[][][]): L.LatLngBounds | null {
  if (!coordinates || coordinates.length === 0 || !coordinates[0] || coordinates[0].length === 0) {
    return null;
  }

  const allPoints = coordinates[0];
  let minLat = allPoints[0][1];
  let maxLat = allPoints[0][1];
  let minLng = allPoints[0][0];
  let maxLng = allPoints[0][0];

  for (const [lng, lat] of allPoints) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return L.latLngBounds(
    [minLat, minLng],
    [maxLat, maxLng]
  );
}

/**
 * Check if polygon is visible in current viewport
 */
export function isPolygonInViewport(
  polygon: GeoJSONFeature,
  mapBounds: L.LatLngBounds
): boolean {
  if (polygon.geometry.type !== 'Polygon') {
    return false;
  }

  const bbox = getBoundingBox(polygon.geometry.coordinates);
  if (!bbox) {
    return false;
  }

  // Check if bounding boxes intersect
  return mapBounds.intersects(bbox);
}

/**
 * Filter polygons to only those visible in viewport
 * This is the key optimization for handling 1000s of polygons
 */
export function filterPolygonsByViewport(
  polygons: GeoJSONFeature[],
  mapBounds: L.LatLngBounds
): GeoJSONFeature[] {
  if (polygons.length < 100) {
    // For small datasets, no need to filter
    return polygons;
  }

  return polygons.filter((polygon) => isPolygonInViewport(polygon, mapBounds));
}

/**
 * Simplify polygon coordinates using Douglas-Peucker algorithm
 * Reduces number of points for better performance at lower zoom levels
 */
export function simplifyPolygon(
  coordinates: number[][],
  tolerance: number = 0.0001
): number[][] {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  // Simple distance-based simplification
  const simplified: number[][] = [coordinates[0]];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const next = coordinates[i + 1];

    // Calculate distance from current point to line between prev and next
    const dist = pointToLineDistance(curr, prev, next);
    
    // Keep point if it's far enough from the line
    if (dist > tolerance) {
      simplified.push(curr);
    }
  }

  simplified.push(coordinates[coordinates.length - 1]);
  return simplified;
}

/**
 * Calculate distance from point to line segment
 */
function pointToLineDistance(
  point: number[],
  lineStart: number[],
  lineEnd: number[]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get simplification tolerance based on zoom level
 * Higher zoom = less simplification (more detail)
 */
export function getSimplificationTolerance(zoom: number): number {
  if (zoom >= 15) {
    return 0.00001; // Very detailed
  } else if (zoom >= 12) {
    return 0.0001; // Detailed
  } else if (zoom >= 10) {
    return 0.001; // Medium
  } else {
    return 0.01; // Simplified
  }
}

/**
 * Batch process polygons to avoid blocking the UI
 */
export function batchProcessPolygons<T>(
  polygons: GeoJSONFeature[],
  processor: (polygon: GeoJSONFeature) => T,
  batchSize: number = 50,
  onBatchComplete?: (results: T[]) => void
): Promise<T[]> {
  return new Promise((resolve) => {
    const results: T[] = [];
    let index = 0;

    const processBatch = () => {
      const batch = polygons.slice(index, index + batchSize);
      const batchResults = batch.map(processor);
      results.push(...batchResults);

      if (onBatchComplete) {
        onBatchComplete(batchResults);
      }

      index += batchSize;

      if (index < polygons.length) {
        // Use requestIdleCallback or setTimeout for non-blocking processing
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(processBatch);
        } else {
          setTimeout(processBatch, 0);
        }
      } else {
        resolve(results);
      }
    };

    processBatch();
  });
}

