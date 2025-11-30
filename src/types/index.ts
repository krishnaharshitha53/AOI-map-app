export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties?: Record<string, any>;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  place_rank: number;
  category: string;
  type: string;
  importance: number;
  icon?: string;
}

export interface MapState {
  center: [number, number];
  zoom: number;
}

export type DrawingMode = 'simple_select' | 'draw_polygon' | 'draw_point' | 'draw_line_string' | 'draw_rectangle' | 'static';

