/**
 * Offline mock data. Each entry matches the backend contract of
 * POST /api/voice-process exactly, so the UI behaves the same with or
 * without the Laravel API.
 */
export const MOCK_RESPONSES = [
  {
    transcription: 'بدي روح على مكة مول، البوابة الرئيسية please',
    detected_landmark: 'Mecca Mall — Main Gate',
    coordinates: { lat: 31.9785, lng: 35.8458 },
    estimated_fare: '3.25 JOD',
    eta_minutes: 12,
  },
  {
    transcription: 'وديني عند البوابة الرئيسية للجامعة الأردنية',
    detected_landmark: 'University of Jordan — Main Gate',
    coordinates: { lat: 32.0137, lng: 35.8723 },
    estimated_fare: '3.80 JOD',
    eta_minutes: 16,
  },
  {
    transcription: 'على الدوار السابع جنب الـ Starbucks لو سمحت',
    detected_landmark: '7th Circle',
    coordinates: { lat: 31.9563, lng: 35.8617 },
    estimated_fare: '2.60 JOD',
    eta_minutes: 10,
  },
  {
    transcription: 'بدي أروح على Abdali Boulevard عند الـ main entrance',
    detected_landmark: 'Abdali Boulevard',
    coordinates: { lat: 31.9636, lng: 35.9094 },
    estimated_fare: '1.45 JOD',
    eta_minutes: 6,
  },
  {
    transcription: 'خذني على شارع الرينبو، قريب من مخبز الرينبو',
    detected_landmark: 'Rainbow Street',
    coordinates: { lat: 31.9512, lng: 35.9223 },
    estimated_fare: '1.20 JOD',
    eta_minutes: 5,
  },
  {
    transcription: 'Taj Mall من عند دوار عبدون',
    detected_landmark: 'Taj Mall (Abdoun Circle)',
    coordinates: { lat: 31.9424, lng: 35.8889 },
    estimated_fare: '2.15 JOD',
    eta_minutes: 9,
  },
];

let cursor = 0;

/** Returns the next mock response in a round-robin so demos show variety. */
export function nextMockResponse() {
  const response = MOCK_RESPONSES[cursor % MOCK_RESPONSES.length];
  cursor += 1;
  return structuredClone(response);
}
