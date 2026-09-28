import { ORIGIN } from '../config';
import AudioWaves from './AudioWaves';
import MicButton from './MicButton';

function formatSeconds(ms) {
  const s = Math.floor(ms / 1000);
  return `0:${String(s).padStart(2, '0')}`;
}

/**
 * Pickup + destination card with the push-to-talk mic built into the
 * destination field.
 */
export default function SearchPanel({ phase, recorder, destinationName, onMicPress }) {
  const recording = recorder.status === 'recording';
  const requesting = recorder.status === 'requesting';
  const processing = phase === 'processing';
  const locked = phase === 'review' || phase === 'confirming' || phase === 'confirmed';

  let micState = 'idle';
  if (recording) micState = 'recording';
  else if (requesting) micState = 'requesting';
  else if (processing) micState = 'processing';
  else if (locked) micState = 'disabled';

  let body;
  if (recording) {
    body = (
      <div className="flex items-center gap-3">
        <AudioWaves levels={recorder.levels} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Listening… {formatSeconds(recorder.elapsedMs)}</p>
          <p className="text-xs text-slate-500">Tap to stop</p>
        </div>
      </div>
    );
  } else if (processing) {
    body = (
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-900">Understanding your destination…</p>
        <p className="text-xs text-slate-500">Transcribing and matching local landmarks</p>
      </div>
    );
  } else if (destinationName) {
    body = <p className="truncate text-sm font-semibold text-slate-900">{destinationName}</p>;
  } else {
    body = (
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-900">Where to?</p>
        <p className="text-xs text-slate-500">Tap the mic and say it — عربي or English</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-white/95 p-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 backdrop-blur">
      <div className="flex items-center gap-3 px-1 pb-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-petra-600 ring-4 ring-petra-100" />
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Pickup</p>
          <p className="truncate text-sm font-medium text-slate-700">
            {ORIGIN.name} · {ORIGIN.subtitle}
          </p>
        </div>
      </div>
      <div
        className={`flex items-center gap-3 rounded-xl py-1.5 pl-3 pr-1.5 transition-colors ${
          recording ? 'bg-red-50 ring-1 ring-red-100' : 'bg-slate-50 ring-1 ring-slate-100'
        }`}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-900" />
        <div className="min-w-0 flex-1" aria-live="polite">
          {body}
        </div>
        <MicButton state={micState} onPress={onMicPress} />
      </div>
    </section>
  );
}
