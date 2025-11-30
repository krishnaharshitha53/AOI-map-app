import type { GeoJSONFeature } from '../types';

const STORAGE_KEY = 'aoi-polygons';

/**
 * Load polygons from localStorage
 */
export function loadPolygonsFromStorage(): GeoJSONFeature[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as GeoJSONFeature[];
  } catch (error) {
    console.error('Error loading polygons from storage:', error);
    return [];
  }
}

/**
 * Save polygons to localStorage
 */
export function savePolygonsToStorage(polygons: GeoJSONFeature[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polygons));
  } catch (error) {
    console.error('Error saving polygons to storage:', error);
  }
}

