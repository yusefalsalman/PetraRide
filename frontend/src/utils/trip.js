/** Vehicle tiers offered in the booking sheet. The backend fare is the Economy price. */
export const VEHICLE_TIERS = [
  { id: 'economy', name: 'Petra Economy', seats: 4, multiplier: 1, icon: '🚗' },
  { id: 'comfort', name: 'Petra Comfort', seats: 4, multiplier: 1.35, icon: '🚙' },
  { id: 'xl', name: 'Petra XL', seats: 6, multiplier: 1.7, icon: '🚐' },
];

export function parseFare(fare) {
  const value = parseFloat(String(fare).replace(/[^\d.]/g, ''));
  return Number.isFinite(value) ? value : null;
}

export function formatFare(value) {
  return `${value.toFixed(2)} JOD`;
}

export function fareForTier(baseFare, tier) {
  const base = parseFare(baseFare);
  if (base === null) return baseFare || '—';
  return formatFare(base * tier.multiplier);
}

export function arrivalClock(etaMinutes, from = new Date()) {
  if (!etaMinutes) return '—';
  const arrival = new Date(from.getTime() + etaMinutes * 60_000);
  return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Great-circle distance in km, used for the trip summary. */
export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Builds a gently curved polyline between two points so the route preview
 * reads as a path rather than a ruler line. Swap for a real routing engine
 * (OSRM / backend) when available.
 */
export function buildRoute(origin, destination, steps = 24) {
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;
  const control = { lat: midLat - dLng * 0.18, lng: midLng + dLat * 0.18 };

  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    points.push([
      u * u * origin.lat + 2 * u * t * control.lat + t * t * destination.lat,
      u * u * origin.lng + 2 * u * t * control.lng + t * t * destination.lng,
    ]);
  }
  return points;
}
