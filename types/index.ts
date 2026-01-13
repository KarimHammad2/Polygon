import type { Feature, Polygon, Position } from "geojson";

export type PricingRule = {
  countryCode: string;
  pricePerKm2: number;
};

export type PricingResult = {
  countryCode: string;
  pricePerKm2: number;
  totalPrice: number;
};

export type DraftArea = {
  geometry: Feature<Polygon>;
  areaKm2: number;
  centroid: Position;
  countryCode: string;
  pricePerKm2: number;
  totalPrice: number;
};

export type PurchaseImage = {
  dataUrl?: string;
  objectUrl?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type StoredPurchasedArea = {
  id: string;
  geometry: Feature<Polygon>;
  areaKm2: number;
  centroid: Position;
  countryCode: string;
  pricePerKm2: number;
  totalPrice: number;
  name: string;
  description?: string;
  imageDataUrl?: string;
  createdAt: string;
};

export type PurchasedArea = StoredPurchasedArea & {
  imageObjectUrl?: string;
};

export type MapDrawEvent = {
  geometry: Feature<Polygon>;
  areaKm2: number;
  centroid: Position;
};

export type PurchaseFormState = {
  name: string;
  description: string;
  consent: boolean;
  image?: PurchaseImage;
};

