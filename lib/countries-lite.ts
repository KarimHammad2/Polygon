import type { FeatureCollection, Polygon } from "geojson";

// Lightweight, highly simplified country polygons (rough bounding boxes).
// Good enough for centroid-based pricing in this MVP.
export const countriesLite: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "US",
      properties: { name: "United States", iso_a2: "US" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-125, 24],
            [-66, 24],
            [-66, 49],
            [-125, 49],
            [-125, 24],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "CA",
      properties: { name: "Canada", iso_a2: "CA" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-140, 49],
            [-52, 49],
            [-52, 70],
            [-140, 70],
            [-140, 49],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "BR",
      properties: { name: "Brazil", iso_a2: "BR" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-74, -34],
            [-34, -34],
            [-34, 5],
            [-74, 5],
            [-74, -34],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "DE",
      properties: { name: "Germany", iso_a2: "DE" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [5.5, 47],
            [15.5, 47],
            [15.5, 55.5],
            [5.5, 55.5],
            [5.5, 47],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "FR",
      properties: { name: "France", iso_a2: "FR" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-5.5, 42],
            [8.5, 42],
            [8.5, 51],
            [-5.5, 51],
            [-5.5, 42],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "GB",
      properties: { name: "United Kingdom", iso_a2: "GB" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-8.5, 49.5],
            [1.8, 49.5],
            [1.8, 59],
            [-8.5, 59],
            [-8.5, 49.5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "IN",
      properties: { name: "India", iso_a2: "IN" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [68, 7],
            [97, 7],
            [97, 37.5],
            [68, 37.5],
            [68, 7],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "CN",
      properties: { name: "China", iso_a2: "CN" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73, 18],
            [135, 18],
            [135, 54],
            [73, 54],
            [73, 18],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "AU",
      properties: { name: "Australia", iso_a2: "AU" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [112, -44],
            [154, -44],
            [154, -10],
            [112, -10],
            [112, -44],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "ZA",
      properties: { name: "South Africa", iso_a2: "ZA" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [16, -35],
            [33, -35],
            [33, -22],
            [16, -22],
            [16, -35],
          ],
        ],
      },
    },
  ],
};

