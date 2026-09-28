import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { JORDAN_PLACES } from '../data/jordanPlaces';

// Governorate centres, labelled on the fallback backdrop.
const GOVERNORATE_IDS = ['amman-downtown', 'zarqa', 'irbid', 'aqaba', 'mafraq', 'jerash', 'ajloun', 'madaba', 'salt', 'karak', 'tafila', 'maan'];
const OFFLINE_LABELS = JORDAN_PLACES.filter((p) => GOVERNORATE_IDS.includes(p.id));

const landmarkLabel = (name) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<span class="petra-landmark-label">${name}</span>`,
  });

const originIcon = L.divIcon({
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `
    <div class="relative grid h-7 w-7 place-items-center">
      <span class="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse-ring"></span>
      <span class="relative h-4 w-4 rounded-full border-[3px] border-white bg-blue-600 shadow-md"></span>
    </div>`,
});

const destinationIcon = L.divIcon({
  className: '',
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  html: `
    <div class="petra-pin-drop flex flex-col items-center">
      <div class="grid h-9 w-9 place-items-center rounded-full border-[3px] border-white bg-blue-900 shadow-lg">
        <span class="h-2.5 w-2.5 rounded-sm bg-white"></span>
      </div>
      <span class="-mt-1 h-3 w-1 rounded-b bg-blue-900"></span>
    </div>`,
});

/** Keeps the camera framed on the trip, leaving room for the overlays. */
function CameraController({ origin, destination }) {
  const map = useMap();

  useEffect(() => {
    if (destination) {
      const bounds = L.latLngBounds([origin.lat, origin.lng], [destination.lat, destination.lng]);
      map.flyToBounds(bounds, {
        paddingTopLeft: [48, 230],
        paddingBottomRight: [48, 400],
        duration: 1.2,
        maxZoom: 15,
      });
    } else {
      map.flyTo([origin.lat, origin.lng], 14, { duration: 0.8 });
    }
  }, [map, origin.lat, origin.lng, destination]);

  return null;
}

export default function MapView({ origin, destination, route }) {
  // If tiles can't load (offline, sandboxed), fall back to a plain backdrop
  // that still labels the known landmarks so the map stays readable.
  const [tilesFailed, setTilesFailed] = useState(false);

  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={14}
      zoomControl={false}
      attributionControl
      className={`h-full w-full ${tilesFailed ? 'petra-offline-map' : ''}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
        eventHandlers={{ tileerror: () => setTilesFailed(true) }}
      />
      {tilesFailed &&
        OFFLINE_LABELS.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={landmarkLabel(p.id === 'amman-downtown' ? 'Amman' : p.name)}
            interactive={false}
          />
        ))}
      <Marker position={[origin.lat, origin.lng]} icon={originIcon} title={origin.name} />
      {destination && (
        <Marker
          key={`${destination.lat},${destination.lng}`}
          position={[destination.lat, destination.lng]}
          icon={destinationIcon}
          title="Destination"
        />
      )}
      {route && destination && (
        <>
          <Polyline positions={route.points} pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.9 }} />
          <Polyline
            positions={route.points}
            pathOptions={{ color: '#2563EB', weight: 5, opacity: 1, dashArray: route.road ? null : '2 10' }}
          />
        </>
      )}
      <CameraController origin={origin} destination={destination} />
    </MapContainer>
  );
}
