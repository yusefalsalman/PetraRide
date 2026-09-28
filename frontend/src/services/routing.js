/**
 * Road routing via the public OSRM demo server. Returns null when it can't be
 * reached (offline, sandboxed), and callers fall back to a drawn curve.
 * For production, route through the backend or a self-hosted OSRM instance.
 */
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const TIMEOUT_MS = 6000;

export async function fetchRoute(origin, destination) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const res = await fetch(`${OSRM_URL}/${coords}?overview=full&geometries=geojson`, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) return null;
    return {
      points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
