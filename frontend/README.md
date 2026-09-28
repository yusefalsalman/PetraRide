# PetraVoice — Frontend (Demo)

Mobile-first React app that simulates the **Petra Ride** rider experience with **PetraVoice**, a hands-free voice assistant for choosing a destination.

Team **PromptRiders** · Jordan 2076 Hackathon · Aqaba 2076 Track · Sub-Track 02: AI Voice Mobility Assistant

## Rider flow

1. **Tap the mic** and say the destination in Jordanian Arabic, English, or both mixed, e.g. "بدي أروح على جامعة الطفيلة", "وديني ع دوار الواحة", "take me to the 7th circle". You can also **type** it.
2. **Live transcript:** the words appear as you speak (browser speech recognition, `ar-JO` or `en-US`), over an animated waveform.
3. The audio is **POSTed** to `${BACKEND_URL}/api/voice-process`. If the backend is offline, the transcript is **matched on-device** against the Jordan landmark graph.
4. **Preview card:** what you said, the matched place (English + Arabic), its category and city, a confidence score, and **"Did you mean"** alternatives.
5. **Map:** the destination pin drops and the route is drawn along real roads (OSRM), or as a dotted curve when routing is unavailable.
6. **Booking sheet:** destination, distance, fare in JOD, trip time and arrival clock, vehicle tier (Economy / Comfort / XL).
7. **Safety gate:** nothing is booked until the rider taps **Confirm Ride**. Then the app shows **"Trip Confirmed! Driver on the way"**.

## Jordan landmark graph (`src/data/jordanPlaces.js`)

107 places across all 12 governorates: governorate centres and towns, 19 universities, Amman's 1st–8th circles and named roundabouts (دوار الواحة، الداخلية، باريس، عبدون، المدينة الرياضية، صويلح…), neighbourhoods, malls, streets, hospitals, bus stations, both airports, Aqaba spots, and tourist sites (Petra, Wadi Rum, Dead Sea, Jerash, Dana…).

Each place has English and Arabic names plus the aliases riders actually say: colloquial forms (التكنو، البلد، الجاردنز), transliterations (Tafileh, Tfeileh), and common speech-to-text spellings. Coordinates are approximate (±150 m) and meant for the demo.

**Matcher** (`src/services/placeResolver.js`):
- Normalises Arabic spelling (أ/إ/آ → ا, ة → ه, ى → ي, diacritics) and prefixes (ال، عال، بال، لل).
- Treats ordinals the same in any form: "السابع" = "seventh" = "7th".
- Drops filler and intent words: بدي، أروح، وديني، خذني، لو سمحت، uh، please, I want to go to…
- Scores exact phrase matches first (longer = more specific, so "جامعة الطفيلة" beats "الطفيلة"), then fuzzy matches to survive recognition errors ("Tafile", "الوحة").
- A bare city name also suggests that city's best-known places.

To add a place, append an entry to `JORDAN_PLACES` and a test case to `placeResolver.test.js`.

**Demo mode** (`VITE_USE_MOCK=true`, or `npm run build:demo`): if the microphone is blocked, the mic button runs a simulated recording that "speaks" sample phrases, so the full flow still works in sandboxed previews.

## Tech stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | React 18 + Vite 5                                             |
| Styling        | Tailwind CSS 3 (brand colors `#1E3A8A` / `#2563EB`)           |
| Audio          | `MediaRecorder` for capture, Web Audio `AnalyserNode` for the waveform |
| Map            | Leaflet 1.9 + React-Leaflet 4 (CARTO Voyager / OSM tiles), OSRM road routing |
| Speech-to-text | Web Speech API (`ar-JO` / `en-US`) for the live transcript and on-device fallback |
| Tests          | Vitest (`npm test`)                                           |

## Setup

Requires **Node.js 18+**.

```bash
cd frontend
npm install
cp .env.example .env      # then edit VITE_BACKEND_URL if needed
npm run dev               # http://localhost:5173
```

Other scripts:

```bash
npm run build       # production build in dist/
npm run build:demo  # one self-contained HTML file in dist-demo/ (demo mode)
npm run preview   # serve the production build
npm run lint      # ESLint
npm test          # matcher tests (Vitest)
```

> Browsers only allow microphone access on **HTTPS or `localhost`**. To test on a phone, use a tunnel (e.g. `ngrok http 5173`) or serve over HTTPS.

### Environment variables

| Variable              | Default                 | Meaning                                                        |
| --------------------- | ----------------------- | -------------------------------------------------------------- |
| `VITE_BACKEND_URL`    | `http://localhost:8000` | Base URL of the Laravel API                                    |
| `VITE_USE_MOCK`       | `false`                 | `true` = never call the API; match on-device and simulate the mic if blocked |
| `VITE_API_TIMEOUT_MS` | `15000`                 | Request timeout before falling back to on-device matching      |

## Backend contract

**Request:** `POST /api/voice-process` as `multipart/form-data`

| Field   | Type | Notes                                                                           |
| ------- | ---- | ------------------------------------------------------------------------------- |
| `audio` | file | `recording.webm` (Chrome/Firefox, Opus) or `recording.m4a` (Safari, `audio/mp4`) |
| `browser_transcript` | text, optional | What the browser's own speech recognition heard; useful as a hint or fallback |

**Response:** `200 OK`

```json
{
  "transcription": "بدي روح على مكة مول، البوابة الرئيسية please",
  "detected_landmark": "Mecca Mall — Main Gate",
  "coordinates": { "lat": 31.9785, "lng": 35.8458 },
  "estimated_fare": "3.25 JOD",
  "eta_minutes": 12
}
```

How the frontend handles responses (`src/services/voiceApi.js`):

- **Network error, timeout, or 5xx:** falls back to on-device matching of the browser transcript. The header badge shows **On-device match** instead of **Live AI**.
- **4xx:** treated as a real answer ("no landmark matched") and shown to the rider as an error.
- **Missing `detected_landmark` or invalid coordinates:** rejected, and the rider is asked to try again.
- `estimated_fare` is treated as the **Economy** price. Comfort (×1.35) and XL (×1.7) are derived from it on the client.
- Optional extra fields are shown when present: `name_ar`, `city`, `category`, `confidence` (0–1), `alternatives` (array of `{ id, name, name_ar, city, lat, lng }`), `distance_km`.

**Laravel notes for the backend team:**

- Enable CORS for the frontend origin (`config/cors.php`, `paths => ['api/*']`).
- Validate with `'audio' => 'required|file|max:10240'`.
- Whisper accepts `webm` and `m4a` directly, so no conversion is needed.

## Project structure

```
frontend/
├── index.html
├── .env.example
├── tailwind.config.js
└── src/
    ├── main.jsx                 # entry, imports Leaflet + Tailwind CSS
    ├── App.jsx                  # flow state machine: idle → processing → review → confirming → confirmed
    ├── config.js                # env vars, origin, recording limits
    ├── hooks/
    │   ├── useVoiceRecorder.js  # MediaRecorder + analyser, push-to-talk, auto-stop, demo simulation
    │   └── useSpeechRecognition.js # live browser transcript (ar-JO / en-US)
    ├── services/
    │   ├── voiceApi.js          # multipart upload, timeout, validation, on-device fallback
    │   ├── placeResolver.js     # Jordanian-aware place matcher (+ .test.js)
    │   └── routing.js           # OSRM road routes
    ├── data/
    │   └── jordanPlaces.js      # Jordan landmark graph + demo phrases
    ├── utils/
    │   ├── trip.js              # tiers, fare model, ETA, distance, fallback route curve
    │   └── dispatch.js          # simulated trip creation (only called from Confirm Ride)
    └── components/
        ├── AppHeader.jsx        # brand + Live AI / Demo data badge
        ├── SearchPanel.jsx      # pickup + destination field with built-in mic
        ├── MicButton.jsx        # pulsing push-to-talk button (idle / recording / processing)
        ├── AudioWaves.jsx       # live waveform bars
        ├── MapView.jsx          # Leaflet map, custom pins, route polyline, camera framing
        ├── TranscriptionCard.jsx# "You said" + detected landmark
        ├── TripSheet.jsx        # SAFETY GATE bottom sheet with Confirm Ride
        ├── ConfirmedSheet.jsx   # "Trip Confirmed! Driver on the way"
        ├── DemoPhrases.jsx      # sample phrases for demos without a mic
        ├── ErrorBanner.jsx
        └── Icons.jsx
```

## Safety gate guarantee

The voice pipeline (`runPipeline` in `App.jsx`) can only move the app as far as the `review` phase. A trip is created (`createTrip`) only in `handleConfirm`, which runs only from the **Confirm Ride** button's `onClick` and only while the app is in `review`.

## Known demo simplifications

- Road routes use the public OSRM demo server; use the backend or a self-hosted OSRM in production.
- Fares and ETAs are estimated on-device from distance (`utils/trip.js`) unless the backend provides them.
- Pickup is fixed to downtown Amman (`config.js → ORIGIN`). It can be replaced with `navigator.geolocation`.
- Trip creation and driver assignment are simulated in `utils/dispatch.js`.
