import { API_TIMEOUT_MS, USE_MOCK, VOICE_ENDPOINT } from '../config';
import { nextMockResponse } from '../data/mockResponses';

const MOCK_LATENCY_MS = 1400;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extensionFor(mimeType = '') {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

/**
 * Validates and normalises a backend payload. Throws if the payload does
 * not match the contract, so a malformed response is never shown to the rider.
 */
export function normalizeVoiceResult(data) {
  const lat = Number(data?.coordinates?.lat);
  const lng = Number(data?.coordinates?.lng);
  const eta = Number(data?.eta_minutes);

  if (!data?.detected_landmark || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Could not recognise a destination. Please try again.');
  }

  return {
    transcription: String(data.transcription ?? ''),
    detected_landmark: String(data.detected_landmark),
    coordinates: { lat, lng },
    estimated_fare: String(data.estimated_fare ?? ''),
    eta_minutes: Number.isFinite(eta) ? Math.max(1, Math.round(eta)) : null,
  };
}

async function postAudio(blob) {
  const form = new FormData();
  form.append('audio', blob, `recording.${extensionFor(blob.type)}`);

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
 * Sends the recorded audio to the backend and resolves with
 * `{ result, source }` where source is 'api' or 'mock'.
 *
 * Network failures, timeouts and 5xx responses fall back to mock data so the
 * demo keeps working offline. 4xx responses (e.g. "no landmark found") are
 * real answers from the backend and are surfaced as errors instead.
 */
export async function processVoice(blob) {
  if (USE_MOCK || !blob) {
    await sleep(MOCK_LATENCY_MS);
    return { result: normalizeVoiceResult(nextMockResponse()), source: 'mock' };
  }

  try {
    const data = await postAudio(blob);
    return { result: normalizeVoiceResult(data), source: 'api' };
  } catch (err) {
    if (err.status && err.status >= 400 && err.status < 500) {
      throw new Error("Sorry, we couldn't match that place. Try saying a nearby landmark.");
    }
    if (err.message?.startsWith('Could not recognise')) throw err;

    console.warn('[PetraVoice] Backend unavailable, using mock data:', err.message);
    return { result: normalizeVoiceResult(nextMockResponse()), source: 'mock' };
  }
}

/** Simulates a voice round-trip for a known sample phrase (demo chips). */
export async function simulateVoice(sample) {
  await sleep(MOCK_LATENCY_MS);
  return { result: normalizeVoiceResult(structuredClone(sample)), source: 'mock' };
}
