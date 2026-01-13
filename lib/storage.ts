import { centroid as turfCentroid } from "@turf/turf";
import type { PurchasedArea, StoredPurchasedArea } from "@/types";

const STORAGE_KEY = "world-map-purchases";

// Local-only persistence for the demo. Replace with server/database storage later.
const dataUrlToBlob = (dataUrl: string): Blob => {
  const [meta, data] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(meta ?? "");
  const mime = mimeMatch?.[1] ?? "image/png";
  const byteString = typeof window !== "undefined" ? atob(data ?? "") : "";
  const array = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i += 1) {
    array[i] = byteString.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
};

const attachObjectUrl = (area: StoredPurchasedArea): PurchasedArea => {
  const centroid =
    area.centroid ?? turfCentroid(area.geometry).geometry.coordinates;

  if (!area.imageDataUrl) {
    return { ...area, centroid };
  }

  try {
    const blob = dataUrlToBlob(area.imageDataUrl);
    const objectUrl = URL.createObjectURL(blob);
    return { ...area, centroid, imageObjectUrl: objectUrl };
  } catch (error) {
    console.error("Failed to build object URL from stored image", error);
    return { ...area, centroid };
  }
};

export const loadPurchasedAreas = (): PurchasedArea[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as StoredPurchasedArea[];
    return parsed.map(attachObjectUrl);
  } catch (error) {
    console.error("Failed to load purchases from storage", error);
    return [];
  }
};

export const savePurchasedAreas = (areas: PurchasedArea[]): void => {
  if (typeof window === "undefined") return;

  try {
    const payload: StoredPurchasedArea[] = areas.map((area) => {
      const { imageObjectUrl, ...rest } = area;
      if (imageObjectUrl) {
        // Drop ephemeral object URLs before persisting to localStorage.
      }
      return rest;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to persist purchases", error);
  }
};

export const clearStorage = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};

