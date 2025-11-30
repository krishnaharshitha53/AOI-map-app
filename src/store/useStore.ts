import { create } from 'zustand';
import type { GeoJSONFeature, NominatimResult, DrawingMode } from '../types';
import { loadPolygonsFromStorage, savePolygonsToStorage } from '../utils/storage';

interface AppState {
  // Map state
  mapCenter: [number, number];
  mapZoom: number;
  
  // Polygon state
  currentPolygon: GeoJSONFeature | null;
  polygons: GeoJSONFeature[];
  
  // Search state
  searchQuery: string;
  searchResults: NominatimResult[];
  isSearching: boolean;
  showSearchResults: boolean;
  
  // Drawing state
  drawingMode: DrawingMode;
  
  // UI state
  isMapLoaded: boolean;
  
  // Actions
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setCurrentPolygon: (polygon: GeoJSONFeature | null) => void;
  addPolygon: (polygon: GeoJSONFeature) => void;
  clearPolygons: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: NominatimResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setShowSearchResults: (show: boolean) => void;
  setDrawingMode: (mode: DrawingMode) => void;
  setIsMapLoaded: (loaded: boolean) => void;
  loadPolygons: () => void;
  savePolygons: () => void;
}

const defaultCenter: [number, number] = [7.5, 51.5]; // Center of NRW, Germany
const defaultZoom = 10;

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  mapCenter: defaultCenter,
  mapZoom: defaultZoom,
  currentPolygon: null,
  polygons: [],
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  showSearchResults: false,
  drawingMode: 'simple_select',
  isMapLoaded: false,
  
  // Actions
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  
  setCurrentPolygon: (polygon) => set({ currentPolygon: polygon }),
  
  addPolygon: (polygon) => {
    const polygons = [...get().polygons, polygon];
    set({ polygons });
    get().savePolygons();
  },
  
  clearPolygons: () => {
    set({ polygons: [], currentPolygon: null });
    get().savePolygons();
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  setIsSearching: (isSearching) => set({ isSearching }),
  
  setShowSearchResults: (show) => set({ showSearchResults: show }),
  
  setDrawingMode: (mode) => set({ drawingMode: mode }),
  
  setIsMapLoaded: (loaded) => set({ isMapLoaded: loaded }),
  
  loadPolygons: () => {
    const polygons = loadPolygonsFromStorage();
    set({ polygons });
  },
  
  savePolygons: () => {
    savePolygonsToStorage(get().polygons);
  },
}));

