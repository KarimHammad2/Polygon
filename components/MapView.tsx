"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import {
  area as turfArea,
  booleanIntersects,
  centroid as turfCentroid,
} from "@turf/turf";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import mapboxgl, {
  type GeoJSONSource,
  type Map as MapboxMap,
  type MapLayerMouseEvent,
} from "mapbox-gl";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapDrawEvent, PurchasedArea } from "@/types";

type MapViewProps = {
  purchasedAreas: PurchasedArea[];
  selectedAreaId?: string;
  drawRequestId: number;
  clearRequestId: number;
  onPolygonCreated: (event: MapDrawEvent) => void;
  onSelectPurchased: (area: PurchasedArea) => void;
  onError: (message: string) => void;
};

const THUMB_AREA_THRESHOLD_KM2 = 50;
const SMALL_AREA_ZOOM_SHOW = 6;
const PURCHASED_SOURCE_ID = "purchased-areas";
const PURCHASED_FILL_LAYER = "purchased-fill";
const PURCHASED_LINE_LAYER = "purchased-outline";

const resolveStyleUrl = (style?: string) => {
  if (!style) return undefined;
  if (style.startsWith("mapbox://") || style.startsWith("http")) return style;
  return `mapbox://styles/${style}`;
};

const MapView = ({
  purchasedAreas,
  selectedAreaId,
  drawRequestId,
  clearRequestId,
  onPolygonCreated,
  onSelectPurchased,
  onError,
}: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const purchasedRef = useRef<PurchasedArea[]>([]);
  const thumbMarkersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const pendingDrawRef = useRef(false);
  const [mapStatus, setMapStatus] = useState<
    "loading" | "ok" | "error" | "blocked"
  >(() => (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? "loading" : "blocked"));

  const envMapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const envMapboxStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE;

  const resolvedStyleUrl = useMemo(
    () => resolveStyleUrl(envMapboxStyle) ?? "mapbox://styles/mapbox/streets-v11",
    [envMapboxStyle],
  );

  const purchasedGeoJson = useMemo<FeatureCollection<Polygon>>(
    () => ({
      type: "FeatureCollection",
      features: purchasedAreas.map((area) => ({
        type: "Feature",
        geometry: area.geometry.geometry,
        properties: {
          id: area.id,
          selected: area.id === selectedAreaId ? 1 : 0,
          name: area.name,
        },
      })),
    }),
    [purchasedAreas, selectedAreaId],
  );

  const updateThumbnailVisibility = useCallback((map: MapboxMap | null) => {
    if (!map) return;
    const zoom = map.getZoom();

    Object.entries(thumbMarkersRef.current).forEach(([areaId, marker]) => {
      const area = purchasedRef.current.find((item) => item.id === areaId);
      if (!area) return;

      const isLarge = area.areaKm2 >= THUMB_AREA_THRESHOLD_KM2;
      const shouldShow = isLarge ? zoom >= 2 : zoom >= SMALL_AREA_ZOOM_SHOW;

      if (shouldShow) {
        marker.addTo(map);
      } else {
        marker.remove();
      }
    });
  }, []);

  useEffect(() => {
    purchasedRef.current = purchasedAreas;
  }, [purchasedAreas]);

  const triggerDrawMode = useCallback(() => {
    const draw = drawRef.current;
    const map = mapRef.current;
    if (!map || !draw) return;
    draw.deleteAll();
    draw.changeMode("draw_polygon");
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!envMapboxToken) {
      onError(
        "Mapbox access token is missing. Set NEXT_PUBLIC_MAPBOX_TOKEN to load the map.",
      );
      return;
    }

    mapboxgl.accessToken = envMapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: resolvedStyleUrl,
      center: [0, 20],
      zoom: 2,
      projection: "mercator",
      attributionControl: true,
      pitchWithRotate: true,
      antialias: true,
    });

    mapRef.current = map;

    const navControl = new mapboxgl.NavigationControl();
    map.addControl(navControl, "top-right");

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "simple_select",
    });
    map.addControl(draw, "top-left");
    drawRef.current = draw;

    const handleLoad = () => {
      setMapStatus("ok");
      map.resize();
      updateThumbnailVisibility(map);
      if (pendingDrawRef.current) {
        triggerDrawMode();
        pendingDrawRef.current = false;
      }
    };

    const handleError = () => {
      setMapStatus("error");
      onError("Mapbox reported an error while loading the map.");
    };

    map.on("load", handleLoad);
    map.on("error", handleError);
    map.on("zoomend", () => updateThumbnailVisibility(map));

    const handleResize = () => map.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      Object.values(thumbMarkersRef.current).forEach((marker) => {
        marker.remove();
      });
      thumbMarkersRef.current = {};
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, [envMapboxToken, onError, resolvedStyleUrl, triggerDrawMode, updateThumbnailVisibility]);

  useEffect(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) return;

    const enforceSingleFeature = (featureId?: string | number) => {
      const all = draw.getAll();
      all.features.forEach((feature) => {
        if (feature.id !== featureId) {
          draw.delete(feature.id as string);
        }
      });
    };

    const handleFeature = (feature: Feature) => {
      if (feature.geometry.type !== "Polygon") {
        if (feature.id) {
          draw.delete(feature.id as string);
        }
        onError("Only polygon drawing is supported.");
        return;
      }

      const polygon = feature as Feature<Polygon>;
      const areaKm2 = turfArea(polygon) / 1_000_000;
      const centroid = turfCentroid(polygon).geometry.coordinates;
      const overlaps = purchasedRef.current.some((area) =>
        booleanIntersects(polygon, area.geometry),
      );

      if (overlaps) {
        onError(
          "This area overlaps an already purchased area. Please adjust your selection.",
        );
        if (feature.id) {
          draw.delete(feature.id as string);
        }
        return;
      }

      enforceSingleFeature(feature.id);
      onPolygonCreated({ geometry: polygon, areaKm2, centroid });
    };

    const handleCreate = (event: { features?: Feature[] }) => {
      const feature = event.features?.[0];
      if (!feature) return;
      handleFeature(feature);
    };

    const handleUpdate = (event: { features?: Feature[] }) => {
      const feature = event.features?.[0];
      if (!feature) return;
      handleFeature(feature);
    };

    map.on("draw.create", handleCreate);
    map.on("draw.update", handleUpdate);

    return () => {
      map.off("draw.create", handleCreate);
      map.off("draw.update", handleUpdate);
    };
  }, [onError, onPolygonCreated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncSource = () => {
      const source = map.getSource(PURCHASED_SOURCE_ID) as GeoJSONSource | undefined;
      if (source) {
        source.setData(purchasedGeoJson);
        return;
      }

      map.addSource(PURCHASED_SOURCE_ID, {
        type: "geojson",
        data: purchasedGeoJson,
        promoteId: "id",
      });

      map.addLayer({
        id: PURCHASED_FILL_LAYER,
        type: "fill",
        source: PURCHASED_SOURCE_ID,
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "selected"], 1],
            "#0ea5e9",
            "#22c55e",
          ],
          "fill-opacity": 0.2,
        },
      });

      map.addLayer({
        id: PURCHASED_LINE_LAYER,
        type: "line",
        source: PURCHASED_SOURCE_ID,
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "selected"], 1],
            "#0ea5e9",
            "#22c55e",
          ],
          "line-width": [
            "case",
            ["==", ["get", "selected"], 1],
            3,
            2,
          ],
        },
      });
    };

    if (map.isStyleLoaded()) {
      syncSource();
    } else {
      map.once("load", syncSource);
    }

    Object.values(thumbMarkersRef.current).forEach((marker) => marker.remove());
    thumbMarkersRef.current = {};

    purchasedAreas.forEach((area) => {
      const coords = area.centroid;
      if (!coords) return;

      const html = area.imageObjectUrl
        ? `<div class="thumb-marker"><img src="${area.imageObjectUrl}" alt="${area.name}" /></div>`
        : `<div class="thumb-marker"><div style="padding:8px 12px;font-weight:600;background:#0ea5e9;color:white;">${area.name ?? "Area"}</div></div>`;

      const element = document.createElement("div");
      element.className = "thumb-wrapper";
      element.innerHTML = html;

      const marker = new mapboxgl.Marker({ element, anchor: "bottom" }).setLngLat([
        coords[0],
        coords[1],
      ]);
      thumbMarkersRef.current[area.id] = marker;
    });

    updateThumbnailVisibility(map);
  }, [purchasedAreas, purchasedGeoJson, updateThumbnailVisibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (event: MapLayerMouseEvent) => {
      const featureId = event.features?.[0]?.properties?.id as string | undefined;
      if (!featureId) return;
      const target = purchasedRef.current.find((area) => area.id === featureId);
      if (target) {
        onSelectPurchased(target);
      }
    };

    const handleEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    let handlersBound = false;
    let waitForLayer: (() => void) | undefined;

    const bindHandlers = () => {
      if (handlersBound) return;
      if (!map.getLayer(PURCHASED_FILL_LAYER)) return;
      map.on("click", PURCHASED_FILL_LAYER, handleClick);
      map.on("mouseenter", PURCHASED_FILL_LAYER, handleEnter);
      map.on("mouseleave", PURCHASED_FILL_LAYER, handleLeave);
      handlersBound = true;
    };

    if (map.isStyleLoaded()) {
      bindHandlers();
    } else {
      const handleStyleData = () => {
        bindHandlers();
        if (handlersBound) {
          map.off("styledata", handleStyleData);
        }
      };
      waitForLayer = handleStyleData;
      map.on("styledata", handleStyleData);
    }

    return () => {
      if (handlersBound) {
        map.off("click", PURCHASED_FILL_LAYER, handleClick);
        map.off("mouseenter", PURCHASED_FILL_LAYER, handleEnter);
        map.off("mouseleave", PURCHASED_FILL_LAYER, handleLeave);
      }
      if (waitForLayer) {
        map.off("styledata", waitForLayer);
      }
    };
  }, [onSelectPurchased, purchasedGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) {
      pendingDrawRef.current = true;
      return;
    }

    if (map.isStyleLoaded()) {
      triggerDrawMode();
      pendingDrawRef.current = false;
    } else {
      pendingDrawRef.current = true;
      map.once("load", () => triggerDrawMode());
    }
  }, [drawRequestId, triggerDrawMode]);

  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) return;
    draw.deleteAll();
  }, [clearRequestId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addBuildings = () => {
      const style = map.getStyle();
      if (!style?.sources?.composite) return;
      if (map.getLayer("building-3d")) return;

      const labelLayer = style.layers?.find(
        (layer) => layer.type === "symbol" && layer.layout?.["text-field"],
      );

      map.addLayer(
        {
          id: "building-3d",
          source: "composite",
          "source-layer": "building",
          filter: ["==", ["get", "extrude"], "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#d1d5db",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              16,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              16,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayer?.id,
      );
    };

    if (map.isStyleLoaded()) {
      addBuildings();
    } else {
      map.on("styledata", addBuildings);
    }

    return () => {
      map.off("styledata", addBuildings);
    };
  }, [resolvedStyleUrl]);

  const mapStatusText = useMemo(() => {
    switch (mapStatus) {
      case "loading":
        return "Loading map…";
      case "ok":
        return "Map ready";
      case "error":
        return "Map error";
      case "blocked":
        return "Map blocked/unreachable";
      default:
        return "Initializing…";
    }
  }, [mapStatus]);

  return (
    <div className="map-shell relative h-full w-full rounded-xl border border-slate-200 shadow-sm">
      <div className="pointer-events-none absolute left-3 top-3 z-5000">
        <div className="rounded-md bg-white/85 px-3 py-2 text-xs font-medium text-slate-700 shadow">
          <span className="font-semibold">Mapbox</span>
          <span className="ml-2 text-slate-600">{mapStatusText}</span>
        </div>
      </div>
      <div ref={containerRef} className="h-full min-h-[70vh] w-full" />
    </div>
  );
};

export default MapView;

