import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
// Import Leaflet.draw types and extend Leaflet namespace
import 'leaflet-draw';
import { useStore } from '../store/useStore';
import type { GeoJSONFeature } from '../types';
import {
  filterPolygonsByViewport,
  getSimplificationTolerance,
  simplifyPolygon,
  batchProcessPolygons,
} from '../utils/performance';
import { debounce } from '../utils/debounce';

// Fix for default marker icon issue in Leaflet with webpack/vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const drawControl = useRef<L.Control.Draw | null>(null);
  const drawHandler = useRef<L.Draw.Polygon | null>(null);
  const drawnLayers = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const wmsLayer = useRef<L.TileLayer.WMS | null>(null);
  const osmLayer = useRef<L.TileLayer | null>(null);
  const isInitialized = useRef(false);
  const isExplicitStop = useRef(false);
  const visiblePolygonsCache = useRef<GeoJSONFeature[]>([]);
  const lastViewportBounds = useRef<L.LatLngBounds | null>(null);

  const {
    mapCenter,
    mapZoom,
    setMapCenter,
    setMapZoom,
    setCurrentPolygon,
    addPolygon,
    setIsMapLoaded,
    drawingMode,
    setDrawingMode,
    loadPolygons,
    polygons,
    isMapLoaded,
  } = useStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || isInitialized.current) return;

    // Initialize Leaflet map
    map.current = L.map(mapContainer.current, {
      center: [mapCenter[1], mapCenter[0]], // Leaflet uses [lat, lng]
      zoom: mapZoom,
      zoomControl: true,
    });

    // Add drawn layers to map (this group holds all drawn polygons)
    drawnLayers.current.addTo(map.current);

    // Initialize WMS layer (NRW satellite imagery)
    wmsLayer.current = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
      layers: 'nw_dop',
      format: 'image/jpeg',
      transparent: false,
      version: '1.1.0',
      crs: L.CRS.EPSG3857,
      attribution: '© NRW Geobasis',
    });

    // Fallback OSM layer
    osmLayer.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    // Try to add WMS layer, fallback to OSM if it fails
    wmsLayer.current.addTo(map.current).on('tileerror', () => {
      console.warn('WMS layer failed, using OSM fallback');
      if (map.current && osmLayer.current) {
        map.current.removeLayer(wmsLayer.current!);
        osmLayer.current.addTo(map.current);
      }
    });

    // Initialize Leaflet.draw
    // Note: Leaflet.draw by default allows unlimited points
    // User can finish by: double-clicking, clicking first point, or clicking Stop button
    drawControl.current = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          // No point limit - allows unlimited points
          drawError: {
            color: '#e1e100',
            message: '<strong>Oh snap!</strong> you can\'t draw that!',
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnLayers.current,
        remove: true,
      },
    });

    map.current.addControl(drawControl.current);

    // Handle map load
    map.current.whenReady(() => {
      console.log('Map loaded successfully');
      setIsMapLoaded(true);
      loadPolygons();
    });

    // Function to update visible polygons based on viewport
    const updateVisiblePolygonsFn = () => {
      if (!map.current || !isInitialized.current) return;
      
      const bounds = map.current.getBounds();
      const allPolygons = useStore.getState().polygons;
      
      // Only filter if we have many polygons (performance optimization)
      if (allPolygons.length >= 100) {
        const visible = filterPolygonsByViewport(allPolygons, bounds);
        visiblePolygonsCache.current = visible;
        lastViewportBounds.current = bounds;
      } else {
        // For small datasets, show all polygons
        visiblePolygonsCache.current = allPolygons;
      }
    };

    // Debounced version for map move events
    const updateVisiblePolygons = debounce(updateVisiblePolygonsFn, 300);

    // Handle map move/zoom to update store (debounced for performance)
    const handleMapMoveFn = () => {
      if (map.current) {
        const center = map.current.getCenter();
        setMapCenter([center.lng, center.lat]);
        setMapZoom(map.current.getZoom());
        updateVisiblePolygons();
      }
    };
    const handleMapMove = debounce(handleMapMoveFn, 150);

    map.current.on('moveend', handleMapMove);
    map.current.on('zoomend', () => {
      if (map.current) {
        setMapZoom(map.current.getZoom());
        updateVisiblePolygons();
      }
    });

    // Handle draw events
    map.current.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      const feature = layer.toGeoJSON() as GeoJSONFeature;

      // Add layer to the map and feature group
      drawnLayers.current.addLayer(layer);
      
      setCurrentPolygon(feature);
      
      // Only add if it's a new polygon (not loaded from storage)
      const existingPolygons = useStore.getState().polygons;
      const isNew = !existingPolygons.some(
        (p) => JSON.stringify(p.geometry) === JSON.stringify(feature.geometry)
      );
      
      if (isNew) {
        addPolygon(feature);
      }
    });

    map.current.on(L.Draw.Event.EDITED, (e: any) => {
      const layers = e.layers;
      layers.eachLayer((layer: any) => {
        const feature = layer.toGeoJSON() as GeoJSONFeature;
        setCurrentPolygon(feature);
        
        // Update polygon in store
        const updatedPolygons = useStore.getState().polygons.map((p) => {
          const pId = (p as any).id;
          const fId = (feature as any).id;
          if (pId && fId && pId === fId) {
            return feature;
          }
          // Fallback: match by geometry if no ID
          if (JSON.stringify(p.geometry) === JSON.stringify(feature.geometry)) {
            return feature;
          }
          return p;
        });
        useStore.setState({ polygons: updatedPolygons });
        useStore.getState().savePolygons();
      });
    });

    map.current.on(L.Draw.Event.DELETED, () => {
      setCurrentPolygon(null);
      
      // Remove deleted polygons from store
      const remainingPolygons: GeoJSONFeature[] = [];
      drawnLayers.current.eachLayer((layer: any) => {
        const feature = layer.toGeoJSON() as GeoJSONFeature;
        remainingPolygons.push(feature);
      });
      
      useStore.setState({ polygons: remainingPolygons });
      useStore.getState().savePolygons();
    });

    map.current.on(L.Draw.Event.DRAWSTART, () => {
      setDrawingMode('draw_polygon');
    });

    map.current.on(L.Draw.Event.DRAWSTOP, () => {
      // DRAWSTOP is called when drawing naturally stops
      // Only handle explicit stops from Stop button
      if (!isExplicitStop.current) {
        // Natural completion (double-click or click first point) - let it complete normally
        const handler = drawHandler.current;
        if (handler) {
          handler.disable();
          drawHandler.current = null;
        }
        setDrawingMode('simple_select');
      }
      isExplicitStop.current = false;
    });

    map.current.on(L.Draw.Event.DRAWVERTEX, () => {
      // Drawing in progress - allow unlimited points
      setDrawingMode('draw_polygon');
    });

    isInitialized.current = true;

    return () => {
      if (drawHandler.current) {
        drawHandler.current.disable();
        drawHandler.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      isInitialized.current = false;
    };
  }, []);

  // Update map center and zoom when store changes
  useEffect(() => {
    if (!map.current || !isInitialized.current) return;

    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();

    const centerChanged =
      Math.abs(currentCenter.lng - mapCenter[0]) > 0.0001 ||
      Math.abs(currentCenter.lat - mapCenter[1]) > 0.0001;
    const zoomChanged = Math.abs(currentZoom - mapZoom) > 0.1;

    if (centerChanged || zoomChanged) {
      map.current.setView([mapCenter[1], mapCenter[0]], mapZoom, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [mapCenter, mapZoom]);

  // Update drawing mode
  useEffect(() => {
    if (!map.current || !isInitialized.current || !isMapLoaded) {
      return;
    }
    
    try {
      if (drawingMode === 'draw_polygon' && map.current) {
        // Disable any existing draw handler
        if (drawHandler.current) {
          drawHandler.current.disable();
          drawHandler.current = null;
        }
        
        // Create and enable polygon drawing
        // Configure to allow unlimited points until user finishes manually
        const handler = new (L.Draw as any).Polygon(map.current, {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.8,
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
          },
        });
        
        // Override the shape's completion logic to allow unlimited points
        // This prevents auto-completion when clicking near first point after 3 points
        const originalEnable = handler.enable.bind(handler);
        handler.enable = function() {
          originalEnable();
          // After enabling, modify the shape to prevent auto-completion
          setTimeout(() => {
            if (this._shape) {
              const shape = this._shape;
              // Override _onMouseDown to prevent auto-completion and allow unlimited points
              const originalOnMouseDown = shape._onMouseDown;
              
              // Override _checkForCompletion to prevent auto-completion
              shape._checkForCompletion = function() {
                // Don't auto-complete - user must explicitly finish via double-click or Stop button
                return false;
              };
              
              // Override _onMouseDown to handle point addition with increased tolerance
              shape._onMouseDown = function(e: L.LeafletMouseEvent) {
                const latlngs = shape._currentLatLngs || [];
                
                // If we have 3+ points, check if clicking near first point
                if (latlngs.length >= 3 && latlngs[0]) {
                  const firstPoint = latlngs[0];
                  const distance = map.current!.distance(firstPoint, e.latlng);
                  
                  // Only complete if VERY close (within 0.5 meters) - user intentionally closing
                  // This allows unlimited points until user explicitly finishes
                  if (distance <= 0.5) {
                    // User intentionally clicked first point - complete polygon
                    if (shape._finishShape) {
                      shape._finishShape();
                    } else {
                      // Fallback: use original behavior for completion
                      if (originalOnMouseDown) {
                        return originalOnMouseDown.call(shape, e);
                      }
                    }
                    return;
                  }
                  
                  // Not close enough - add as new vertex (allows unlimited points)
                  if (shape.addVertex) {
                    shape.addVertex(e);
                  } else {
                    // Fallback: manually add vertex
                    shape._currentLatLngs.push(e.latlng);
                    if (shape._updateGuide) shape._updateGuide();
                    if (shape._updateFinish) shape._updateFinish();
                  }
                  return;
                }
                
                // Less than 3 points - use original behavior
                if (originalOnMouseDown) {
                  return originalOnMouseDown.call(shape, e);
                }
              };
            }
          }, 150);
        };
        
        drawHandler.current = handler;
        handler.enable();
        console.log('Drawing mode changed to draw_polygon - unlimited points enabled');
      } else if (drawingMode === 'simple_select') {
        // User clicked Stop button - finish polygon if it has 3+ points
        isExplicitStop.current = true;
        const handler = drawHandler.current as any;
        if (handler && handler._shape) {
          try {
            const shape = handler._shape;
            // Check if there's an incomplete polygon with 3+ points
            if (shape._currentLatLngs && shape._currentLatLngs.length >= 3) {
              // Complete the polygon manually
              const latlngs = [...shape._currentLatLngs];
              // Close the polygon if not already closed
              if (latlngs.length > 0 && !latlngs[0].equals(latlngs[latlngs.length - 1])) {
                latlngs.push(latlngs[0].clone());
              }
              
              // Create completed polygon
              const polygon = L.polygon(latlngs, {
                color: '#3b82f6',
                weight: 2,
                opacity: 0.8,
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
              });
              
              // Add to map
              drawnLayers.current.addLayer(polygon);
              const feature = polygon.toGeoJSON() as GeoJSONFeature;
              setCurrentPolygon(feature);
              
              // Add to store if new
              const existingPolygons = useStore.getState().polygons;
              const isNew = !existingPolygons.some(
                (p) => JSON.stringify(p.geometry) === JSON.stringify(feature.geometry)
              );
              if (isNew) {
                addPolygon(feature);
              }
              
              // Clear the incomplete shape
              shape._clearGuides();
              handler.disable();
              drawHandler.current = null;
              console.log('Polygon completed via Stop button');
              return;
            }
          } catch (error) {
            console.log('Could not auto-finish polygon when stopping:', error);
          }
        }
        
        // Disable drawing handler
        if (drawHandler.current) {
          drawHandler.current.disable();
          drawHandler.current = null;
        }
        console.log('Drawing mode changed to simple_select');
      }
    } catch (error) {
      console.error('Error changing drawing mode:', error);
    }
  }, [drawingMode, isMapLoaded]);

  // Function to update map polygons with performance optimizations
  const updateMapPolygons = useCallback((polygonsToRender: GeoJSONFeature[], zoom: number) => {
    if (!map.current || !isInitialized.current || !drawnLayers.current) return;

    // Clear existing features
    drawnLayers.current.clearLayers();

    // Get simplification tolerance based on zoom level
    const tolerance = getSimplificationTolerance(zoom);
    const shouldSimplify = zoom < 12 && polygonsToRender.length > 50;

    // Process polygons in batches to avoid blocking UI
    if (polygonsToRender.length > 100) {
      batchProcessPolygons(
        polygonsToRender,
        (polygon) => {
          try {
            let geometry = polygon.geometry;
            
            // Simplify geometry at lower zoom levels for performance
            if (shouldSimplify && geometry.type === 'Polygon' && geometry.coordinates[0]) {
              const outerRing = geometry.coordinates[0];
              if (Array.isArray(outerRing) && outerRing.length > 0 && Array.isArray(outerRing[0])) {
                const simplified = simplifyPolygon(outerRing as number[][], tolerance);
                geometry = {
                  ...geometry,
                  coordinates: [simplified],
                };
              }
            }

            const layer = L.geoJSON({ ...polygon, geometry } as any, {
              style: {
                color: '#3b82f6',
                weight: 2,
                opacity: 0.8,
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
              },
            });
            drawnLayers.current.addLayer(layer);
            return layer;
          } catch (error) {
            console.error('Error adding polygon to map:', error);
            return null;
          }
        },
        50, // Process 50 polygons at a time
        () => {
          // Optional: Update UI after each batch
        }
      );
    } else {
      // For smaller datasets, render all at once
      polygonsToRender.forEach((polygon) => {
        try {
          let geometry = polygon.geometry;
          
          // Simplify geometry at lower zoom levels
          if (shouldSimplify && geometry.type === 'Polygon' && geometry.coordinates[0]) {
            const outerRing = geometry.coordinates[0];
            if (Array.isArray(outerRing) && outerRing.length > 0 && Array.isArray(outerRing[0])) {
              const simplified = simplifyPolygon(outerRing as number[][], tolerance);
              geometry = {
                ...geometry,
                coordinates: [simplified],
              };
            }
          }

          const layer = L.geoJSON({ ...polygon, geometry } as any, {
            style: {
              color: '#3b82f6',
              weight: 2,
              opacity: 0.8,
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
            },
          });
          drawnLayers.current.addLayer(layer);
        } catch (error) {
          console.error('Error adding polygon to map:', error);
        }
      });
    }
  }, []);

  // Load existing polygons when they change (with performance optimizations)
  useEffect(() => {
    if (!map.current || !isInitialized.current || !drawnLayers.current) return;

    const bounds = map.current.getBounds();
    let polygonsToRender = polygons;

    // Filter polygons by viewport for large datasets (performance optimization)
    if (polygons.length >= 100) {
      // Check if we can use cached result
      if (lastViewportBounds.current && bounds.equals(lastViewportBounds.current)) {
        polygonsToRender = visiblePolygonsCache.current;
      } else {
        // Filter by viewport
        polygonsToRender = filterPolygonsByViewport(polygons, bounds);
        visiblePolygonsCache.current = polygonsToRender;
        lastViewportBounds.current = bounds;
      }
    }
    
    updateMapPolygons(polygonsToRender, mapZoom);
  }, [polygons, mapZoom, updateMapPolygons]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: '100vh' }}
    />
  );
}
