import { API_TIMEOUT_MS, ORIGIN, USE_MOCK, VOICE_ENDPOINT } from '../config';
import { CATEGORY_LABELS } from '../data/jordanPlaces';
import { ROAD_FACTOR, distanceKm, estimateFare, estimateMinutes, formatFare } from '../utils/trip';
import { resolvePlace, suggestPlaces } from './placeResolver';

const LOCAL_LATENCY_MS = 900;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Raised when nothing in the landmark graph matches; carries suggestions. */
export class NoMatchError extends Error {
  constructor(message, suggestions = []) {
    super(message);
    this.name = 'NoMatchError';
    this.suggestions = suggestions;
  }
}

function extensionFor(mimeType = '') {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

/**
 * Validates and normalises a backend payload. Throws if the payload does
 * not match the contract, so a malformed response is never shown to the rider.
 * Optional extra fields (city, category, confidence, ...) are passed through.
 */
export function normalizeVoiceResult(data) {
  const lat = Number(data?.coordinates?.lat);
  const lng = Number(data?.coordinates?.lng);
  const eta = Number(data?.eta_minutes);

  if (!data?.detected_landmark || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Could not recognise a destination. Please try again.');
  }

  return {
    ...data,
    transcription: String(data.transcription ?? ''),
    detected_landmark: String(data.detected_landmark),
    coordinates: { lat, lng },
    estimated_fare: String(data.estimated_fare ?? ''),
    eta_minutes: Number.isFinite(eta) ? Math.max(1, Math.round(eta)) : null,
  };
}

/** Builds a contract-shaped result for a place from the landmark graph. */
export function resultForPlace(place, transcription, extras = {}) {
  const roadKm = distanceKm(ORIGIN, place) * ROAD_FACTOR;
  return {
    transcription,
    detected_landmark: place.name,
    coordinates: { lat: place.lat, lng: place.lng },
    estimated_fare: formatFare(estimateFare(roadKm)),
    eta_minutes: estimateMinutes(roadKm),
    place_id: place.id,
    name_ar: place.name_ar,
    city: place.city,
    category: CATEGORY_LABELS[place.category] || place.category,
    distance_km: roadKm,
    ...extras,
  };
}

/** Matches a transcript against the Jordan landmark graph on-device. */
export function resolveLocally(transcription) {
  const text = String(transcription || '').trim();
  if (!text) {
    throw new NoMatchError("I didn't catch a place name. Tap the mic and try again, or type it.");
  }
  const match = resolvePlace(text);
  if (!match) {
    throw new NoMatchError(`Couldn't find "${text}" in Jordan. Try a nearby landmark, circle or city.`, suggestPlaces(text));
  }
  return resultForPlace(match.place, text, {
    confidence: match.confidence,
    matched_alias: match.matched,
    alternatives: match.alternatives.map((a) => a.place),
  });
}

async function postAudio(blob, transcript) {
  const form = new FormData();
  form.append('audio', blob, `recording.${extensionFor(blob.type)}`);
  // Browser transcript as a hint; the backend may ignore it.
  if (transcript) form.append('browser_transcript', transcript);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(VOICE_ENDPOINT, {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = new Error(`Voice API responded with ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves a spoken request to `{ result, source }`, source being 'api' or
 * 'local'.
 *
 * With a backend, the audio is sent to /api/voice-process. If the backend is
 * unreachable (network error, timeout, 5xx) or mock mode is on, the browser's
 * own transcript is matched on-device against the Jordan landmark graph.
 * A 4xx from the backend is a real "no match" answer and is surfaced as-is.
 */
export async function processVoice(blob, transcript) {
  if (!USE_MOCK && blob) {
    try {
      const data = await postAudio(blob, transcript);
      return { result: normalizeVoiceResult(data), source: 'api' };
    } catch (err) {
      if (err.status && err.status >= 400 && err.status < 500) {
        throw new NoMatchError("Sorry, we couldn't match that place. Try saying a nearby landmark.");
      }
      if (err.message?.startsWith('Could not recognise')) throw err;
      console.warn('[PetraVoice] Backend unavailable, matching on-device:', err.message);
    }
  } else {
    await sleep(LOCAL_LATENCY_MS);
  }
  return { result: resolveLocally(transcript), source: 'local' };
}

/** Typed search and demo phrases: always matched on-device. */
export async function processText(text) {
  await sleep(LOCAL_LATENCY_MS);
  return { result: resolveLocally(text), source: 'local' };
}
