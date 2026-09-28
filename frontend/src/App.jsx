import { useCallback, useEffect, useRef, useState } from 'react';
import AppHeader from './components/AppHeader';
import ConfirmedSheet from './components/ConfirmedSheet';
import DemoPhrases from './components/DemoPhrases';
import ErrorBanner from './components/ErrorBanner';
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import TranscriptionCard from './components/TranscriptionCard';
import TripSheet from './components/TripSheet';
import { ORIGIN, USE_MOCK } from './config';
import { DEMO_UTTERANCES } from './data/jordanPlaces';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import { fetchRoute } from './services/routing';
import { processText, processVoice, resultForPlace } from './services/voiceApi';
import { createTrip } from './utils/dispatch';
import { VEHICLE_TIERS, buildRoute, estimateFare, fareForTier, formatFare } from './utils/trip';

const SIMULATED_TYPING_MS = 2200;

/**
 * Flow: idle → (recording) → processing → review → confirming → confirmed
 *
 * Voice and text input can only move the app as far as "review". Reaching
 * "confirmed" requires the rider's explicit tap on Confirm Ride.
 */
export default function App() {
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null); // { message, suggestions, query }
  const [tierId, setTierId] = useState(VEHICLE_TIERS[0].id);
  const [trip, setTrip] = useState(null);
  const [route, setRoute] = useState(null); // { points, road }
  const [lang, setLang] = useState('ar-JO');
  const [typed, setTyped] = useState('');

  const requestIdRef = useRef(0);
  const simulatedTextRef = useRef('');
  const demoIndexRef = useRef(0);

  const speech = useSpeechRecognition({ lang });

  const runPipeline = useCallback(async (task, query = '') => {
    const requestId = ++requestIdRef.current;
    setPhase('processing');
    setError(null);
    setResult(null);
    setRoute(null);
    try {
      const { result: next, source: from } = await task();
      if (requestId !== requestIdRef.current) return; // superseded
      setResult(next);
      setSource(from);
      setTierId(VEHICLE_TIERS[0].id);
      setPhase('review'); // never auto-dispatch: stop at the review sheet
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError({
        message: err.message || 'Something went wrong. Please try again.',
        suggestions: err.suggestions || [],
        query,
      });
      setPhase('idle');
    }
  }, []);

  const recorder = useVoiceRecorder({
    onComplete: (blob) => {
      runPipeline(async () => {
        const text = blob ? await speech.stop() : simulatedTextRef.current;
        return processVoice(blob, text);
      });
    },
    onError: (message) => {
      speech.abort();
      setError({ message, suggestions: [] });
    },
    simulateWhenUnavailable: USE_MOCK,
  });

  // Simulated microphone (demo mode without mic access): "type" a sample
  // utterance into the live transcript as if it were being recognised.
  useEffect(() => {
    if (!recorder.simulated) return undefined;
    speech.abort();
    const utterance = DEMO_UTTERANCES[demoIndexRef.current % DEMO_UTTERANCES.length];
    demoIndexRef.current += 1;
    simulatedTextRef.current = utterance;
    const words = utterance.split(' ');
    let shown = 0;
    const timer = setInterval(() => {
      shown += 1;
      speech.setSimulatedTranscript(words.slice(0, shown).join(' '));
      if (shown >= words.length) clearInterval(timer);
    }, SIMULATED_TYPING_MS / words.length);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.simulated]);

  // Draw a route as soon as a destination is known: a quick curve first,
  // then real roads when the routing service answers.
  const destKey = result ? `${result.coordinates.lat},${result.coordinates.lng}` : null;
  useEffect(() => {
    if (!result) return undefined;
    let cancelled = false;
    const dest = result.coordinates;
    setRoute({ points: buildRoute(ORIGIN, dest), road: false });
    fetchRoute(ORIGIN, dest).then((road) => {
      if (cancelled || !road) return;
      setRoute({ points: road.points, road: true });
      // Refine on-device estimates with the real road distance and time.
      if (source === 'local') {
        setResult((prev) =>
          prev
            ? {
                ...prev,
                distance_km: road.distanceKm,
                estimated_fare: formatFare(estimateFare(road.distanceKm)),
                eta_minutes: Math.max(3, Math.round(road.durationMin * 1.15 + 2)),
              }
            : prev,
        );
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destKey]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setPhase('idle');
    setResult(null);
    setRoute(null);
    setTrip(null);
    setError(null);
    setTyped('');
  }, []);

  const startListening = () => {
    setError(null);
    speech.start();
    recorder.start();
  };

  const handleMicPress = () => {
    if (recorder.status === 'recording') {
      recorder.stop();
      return;
    }
    if (phase !== 'idle') return;
    startListening();
  };

  const handleTextSubmit = (text) => {
    if (!text.trim() || phase !== 'idle') return;
    runPipeline(() => processText(text), text);
  };

  const handleRetry = () => {
    reset();
    startListening();
  };

  const choosePlace = (place, transcription) => {
    runPipeline(async () => ({ result: resultForPlace(place, transcription), source: 'local' }));
  };

  const handleConfirm = async () => {
    if (phase !== 'review' || !result) return;
    const tier = VEHICLE_TIERS.find((t) => t.id === tierId) ?? VEHICLE_TIERS[0];
    setPhase('confirming');
    try {
      const created = await createTrip({
        destination: result.detected_landmark,
        fare: fareForTier(result.estimated_fare, tier),
        tierName: tier.name,
      });
      setTrip(created);
      setPhase('confirmed');
    } catch {
      setError({ message: 'Could not request a driver. Please try again.', suggestions: [] });
      setPhase('review');
    }
  };

  const destination = result?.coordinates ?? null;
  const showOverlayCards = phase === 'idle' && recorder.status === 'idle';
  const inBooking = phase === 'review' || phase === 'confirming' || phase === 'confirmed';

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-200 via-slate-100 to-petra-100 sm:py-6">
      <main className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-white sm:h-[min(880px,calc(100dvh-3rem))] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-slate-900">
        {/* Map layer */}
        <div className="absolute inset-0 isolate z-0">
          <MapView origin={ORIGIN} destination={destination} route={phase !== 'idle' ? route : null} />
        </div>

        {/* Top overlay */}
        <div className="pointer-events-none relative z-10 flex flex-col gap-3 bg-gradient-to-b from-white via-white/80 to-transparent p-4 pb-8">
          <div className="pointer-events-auto">
            <AppHeader source={source} />
          </div>
          {!inBooking && (
            <div className="pointer-events-auto">
              <SearchPanel
                phase={phase}
                recorder={recorder}
                liveTranscript={speech.transcript}
                typed={typed}
                onTypedChange={setTyped}
                onSubmitText={handleTextSubmit}
                onMicPress={handleMicPress}
                lang={lang}
                onLangChange={setLang}
              />
            </div>
          )}
          {error && (
            <div className="pointer-events-auto">
              <ErrorBanner
                message={error.message}
                suggestions={error.suggestions}
                onPick={(place) => choosePlace(place, error.query || place.name_ar)}
                onDismiss={() => setError(null)}
              />
            </div>
          )}
          {result && phase !== 'confirmed' && (
            <div className="pointer-events-auto">
              <TranscriptionCard
                result={result}
                disabled={phase === 'confirming'}
                onPickAlternative={(place) => choosePlace(place, result.transcription)}
              />
            </div>
          )}
        </div>

        {/* Bottom overlay */}
        <div className="pointer-events-none relative z-10 mt-auto">
          <div className="pointer-events-auto">
            {showOverlayCards && (
              <div className="p-4">
                <DemoPhrases
                  onPick={(utterance) => runPipeline(() => processText(utterance), utterance)}
                  disabled={phase !== 'idle'}
                />
              </div>
            )}
            {(phase === 'review' || phase === 'confirming') && result && (
              <TripSheet
                result={result}
                roadRoute={Boolean(route?.road)}
                tierId={tierId}
                onTierChange={setTierId}
                onConfirm={handleConfirm}
                onRetry={handleRetry}
                confirming={phase === 'confirming'}
              />
            )}
            {phase === 'confirmed' && trip && <ConfirmedSheet trip={trip} onDone={reset} />}
          </div>
        </div>
      </main>
    </div>
  );
}
