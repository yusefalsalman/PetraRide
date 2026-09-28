import { useCallback, useRef, useState } from 'react';
import AppHeader from './components/AppHeader';
import ConfirmedSheet from './components/ConfirmedSheet';
import DemoPhrases from './components/DemoPhrases';
import ErrorBanner from './components/ErrorBanner';
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import TranscriptionCard from './components/TranscriptionCard';
import TripSheet from './components/TripSheet';
import { ORIGIN } from './config';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import { processVoice, simulateVoice } from './services/voiceApi';
import { createTrip } from './utils/dispatch';
import { VEHICLE_TIERS, fareForTier } from './utils/trip';

/**
 * Flow: idle → (recording) → processing → review → confirming → confirmed
 *
 * The voice pipeline can only move the app as far as "review". Reaching
 * "confirmed" requires the rider's explicit tap on Confirm Ride.
 */
export default function App() {
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);
  const [tierId, setTierId] = useState(VEHICLE_TIERS[0].id);
  const [trip, setTrip] = useState(null);
  const requestIdRef = useRef(0);

  const runPipeline = useCallback(async (task) => {
    const requestId = ++requestIdRef.current;
    setPhase('processing');
    setError(null);
    setResult(null);
    try {
      const { result: next, source: from } = await task();
      if (requestId !== requestIdRef.current) return; // superseded
      setResult(next);
      setSource(from);
      setTierId(VEHICLE_TIERS[0].id);
      setPhase('review'); // never auto-dispatch: stop at the review sheet
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase('idle');
    }
  }, []);

  const recorder = useVoiceRecorder({
    onComplete: (blob) => runPipeline(() => processVoice(blob)),
    onError: (message) => setError(message),
  });

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setPhase('idle');
    setResult(null);
    setTrip(null);
    setError(null);
  }, []);

  const handleMicPress = () => {
    if (recorder.status === 'recording') {
      recorder.stop();
      return;
    }
    if (phase !== 'idle') return;
    setError(null);
    recorder.start();
  };

  const handleRetry = () => {
    reset();
    recorder.start();
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
      setError('Could not request a driver. Please try again.');
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
          <MapView origin={ORIGIN} destination={destination} showRoute={phase !== 'idle'} />
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
                destinationName={result?.detected_landmark}
                onMicPress={handleMicPress}
              />
            </div>
          )}
          {error && (
            <div className="pointer-events-auto">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}
          {result && phase !== 'confirmed' && (
            <div className="pointer-events-auto">
              <TranscriptionCard result={result} />
            </div>
          )}
        </div>

        {/* Bottom overlay */}
        <div className="pointer-events-none relative z-10 mt-auto">
          <div className="pointer-events-auto">
            {showOverlayCards && (
              <div className="p-4">
                <DemoPhrases onPick={(sample) => runPipeline(() => simulateVoice(sample))} disabled={phase !== 'idle'} />
              </div>
            )}
            {(phase === 'review' || phase === 'confirming') && result && (
              <TripSheet
                result={result}
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
