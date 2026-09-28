# PetraVoice — Frontend (Demo)

Mobile-first React app that simulates the **Petra Ride** rider experience with **PetraVoice**, a hands-free voice assistant for choosing a destination.

Team **PromptRiders** · Jordan 2076 Hackathon · Aqaba 2076 Track · Sub-Track 02: AI Voice Mobility Assistant

## Rider flow

1. **Tap the mic** in the "Where to?" field and say the destination in Jordanian Arabic, English, or a mix of both.
2. **Live waveform** shows the app is listening. Tap again to stop. Recording stops on its own after 15 seconds.
3. The audio blob is **POSTed** as `multipart/form-data` to `${BACKEND_URL}/api/voice-process`. A spinner shows while it's processing.
4. **Preview card** shows the transcription and the detected landmark. The map drops a destination pin and draws the route.
5. **Booking sheet** shows the destination, fare in JOD, ETA and arrival time, and the vehicle tier (Economy / Comfort / XL).
6. **Safety gate:** nothing is booked until the rider taps **Confirm Ride**. Then the app shows **"Trip Confirmed! Driver on the way"**.

No microphone? Tap one of the **"Try saying"** phrases to run the same flow with sample data.

## Tech stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | React 18 + Vite 5                                             |
| Styling        | Tailwind CSS 3 (brand colors `#1E3A8A` / `#2563EB`)           |
| Audio          | `MediaRecorder` for capture, Web Audio `AnalyserNode` for the waveform |
| Map            | Leaflet 1.9 + React-Leaflet 4 (CARTO Voyager / OSM tiles)     |

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
npm run build     # production build in dist/
npm run preview   # serve the production build
npm run lint      # ESLint
```

> Browsers only allow microphone access on **HTTPS or `localhost`**. To test on a phone, use a tunnel (e.g. `ngrok http 5173`) or serve over HTTPS.

### Environment variables

| Variable              | Default                 | Meaning                                                        |
| --------------------- | ----------------------- | -------------------------------------------------------------- |
| `VITE_BACKEND_URL`    | `http://localhost:8000` | Base URL of the Laravel API                                    |
| `VITE_USE_MOCK`       | `false`                 | `true` = never call the API, always use mock data              |
| `VITE_API_TIMEOUT_MS` | `15000`                 | Request timeout before falling back to mock data               |

## Backend contract

**Request:** `POST /api/voice-process` as `multipart/form-data`

| Field   | Type | Notes                                                                           |
| ------- | ---- | ------------------------------------------------------------------------------- |
| `audio` | file | `recording.webm` (Chrome/Firefox, Opus) or `recording.m4a` (Safari, `audio/mp4`) |

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

- **Network error, timeout, or 5xx:** falls back to mock data. The header badge shows **Demo data**.
- **4xx:** treated as a real answer ("no landmark matched") and shown to the rider as an error.
- **Missing `detected_landmark` or invalid coordinates:** rejected, and the rider is asked to try again.
- `estimated_fare` is treated as the **Economy** price. Comfort (×1.35) and XL (×1.7) are derived from it on the client.

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
    │   └── useVoiceRecorder.js  # MediaRecorder + analyser, push-to-talk, auto-stop, mic cleanup
    ├── services/
    │   └── voiceApi.js          # multipart upload, timeout, validation, mock fallback
    ├── data/
    │   └── mockResponses.js     # offline responses that match the backend contract
    ├── utils/
    │   ├── trip.js              # tiers, fare maths, ETA clock, distance, route curve
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

- The route is a smooth curve between the two points, not road routing. It can be swapped for OSRM or a route from the backend in `utils/trip.js → buildRoute`.
- Pickup is fixed to downtown Amman (`config.js → ORIGIN`). It can be replaced with `navigator.geolocation`.
- Trip creation and driver assignment are simulated in `utils/dispatch.js`.
