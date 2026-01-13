import { area as turfArea, booleanPointInPolygon, centroid } from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import { countriesLite } from "./countries-lite";
import type { PricingResult, PricingRule } from "@/types";

export const pricingRules: PricingRule[] = [
  { countryCode: "US", pricePerKm2: 0.8 },
  { countryCode: "DE", pricePerKm2: 1.0 },
  { countryCode: "BR", pricePerKm2: 0.3 },
  { countryCode: "AU", pricePerKm2: 0.4 },
  { countryCode: "IN", pricePerKm2: 0.35 },
  { countryCode: "DEFAULT", pricePerKm2: 0.5 },
];

const clampPrice = (price: number) => Math.min(1, Math.max(0.1, price));

export const lookupCountryCode = (polygon: Feature<Polygon>): string => {
  const center = centroid(polygon);

  for (const feature of countriesLite.features) {
    if (booleanPointInPolygon(center, feature)) {
      return (feature.properties as { iso_a2?: string })?.iso_a2 ?? "DEFAULT";
    }
  }

  return "DEFAULT";
};

export const computePricing = (
  polygon: Feature<Polygon>,
  areaKm2?: number,
): PricingResult => {
  const resolvedAreaKm2 = areaKm2 ?? turfArea(polygon) / 1_000_000;
  const countryCode = lookupCountryCode(polygon);
  const rule =
    pricingRules.find((item) => item.countryCode === countryCode) ??
    pricingRules.find((item) => item.countryCode === "DEFAULT")!;

  const pricePerKm2 = clampPrice(rule.pricePerKm2);

  return {
    countryCode,
    pricePerKm2,
    totalPrice: Math.max(0, resolvedAreaKm2 * pricePerKm2),
  };
};

