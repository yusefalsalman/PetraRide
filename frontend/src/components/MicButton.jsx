import { MicIcon, Spinner, StopIcon } from './Icons';

/**
 * Push-to-talk button. Tap to start, tap again to stop.
 * state: idle | requesting | recording | processing | disabled
 */
export default function MicButton({ state, onPress }) {
  const recording = state === 'recording';
  const busy = state === 'processing' || state === 'requesting';
  const disabled = busy || state === 'disabled';

  const label = recording ? 'Stop recording' : busy ? 'Processing' : 'Speak your destination';

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={label}
      aria-pressed={recording}
      className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-petra-100 disabled:cursor-not-allowed"
    >
      {(state === 'idle' || recording) && (
        <span
          className={`absolute inset-0 rounded-full animate-pulse-ring ${recording ? 'bg-red-500' : 'bg-petra-600'}`}
        />
      )}
      <span
        className={`relative grid h-12 w-12 place-items-center rounded-full text-white shadow-lg transition-colors ${
          recording ? 'bg-red-500' : disabled ? 'bg-slate-300' : 'bg-petra-600 hover:bg-petra-700 active:scale-95'
        }`}
      >
        {busy ? <Spinner /> : recording ? <StopIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
      </span>
    </button>
  );
}
