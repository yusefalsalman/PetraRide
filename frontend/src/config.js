const env = import.meta.env;

export const BACKEND_URL = (env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');
export const USE_MOCK = String(env.VITE_USE_MOCK).toLowerCase() === 'true';
export const API_TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS) || 15000;

export const VOICE_ENDPOINT = `${BACKEND_URL}/api/voice-process`;

/** Rider's current location (downtown Amman). */
export const ORIGIN = {
  name: 'Your location',
  subtitle: 'Downtown Amman',
  lat: 31.9539,
  lng: 35.9106,
};

/** Recording is stopped automatically after this long. */
export const MAX_RECORDING_MS = 15000;
/** Recordings shorter than this are treated as accidental taps. */
export const MIN_RECORDING_MS = 600;
