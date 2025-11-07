// @ts-ignore - turf types issue with package.json exports
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, Point } from 'geojson';

export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: Feature<Polygon | MultiPolygon>
): boolean {
  try {
    const point = turf.point([lng, lat]);
    return turf.booleanPointInPolygon(point, polygon);
  } catch (error) {
    console.error('Error checking point in polygon:', error);
    return false;
  }
}

export function createBBox(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
) {
  return {
    minLat,
    minLng,
    maxLat,
    maxLng,
  };
}

export function isInBBox(
  lat: number,
  lng: number,
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number }
): boolean {
  return (
    lat >= bbox.minLat &&
    lat <= bbox.maxLat &&
    lng >= bbox.minLng &&
    lng <= bbox.maxLng
  );
}

export function distanceBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const from = turf.point([lng1, lat1]);
  const to = turf.point([lng2, lat2]);
  return turf.distance(from, to, { units: 'kilometers' });
}

