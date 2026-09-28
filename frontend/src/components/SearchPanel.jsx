import { ORIGIN } from '../config';
import AudioWaves from './AudioWaves';
import MicButton from './MicButton';

function formatSeconds(ms) {
  const s = Math.floor(ms / 1000);
  return `0:${String(s).padStart(2, '0')}`;
}

const LANGS = [
  { id: 'ar-JO', label: 'عربي' },
  { id: 'en-US', label: 'EN' },
];

/**
 * Pickup + destination card. The destination field takes typed input and
 * has the push-to-talk mic built in; while recording it shows the live
 * transcript.
 */
export default function SearchPanel({
  phase,
  recorder,
  liveTranscript,
  typed,
  onTypedChange,
  onSubmitText,
  onMicPress,
  lang,
  onLangChange,
}) {
  const recording = recorder.status === 'recording';
  const requesting = recorder.status === 'requesting';
  const processing = phase === 'processing';

  let micState = 'idle';
  if (recording) micState = 'recording';
  else if (requesting) micState = 'requesting';
  else if (processing) micState = 'processing';

  let body;
  if (recording) {
    body = (
      <div className="flex min-w-0 items-center gap-3">
        <AudioWaves levels={recorder.levels} />
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-semibold text-slate-900">
            Listening… {formatSeconds(recorder.elapsedMs)}
            {recorder.simulated && (
              <span className="ml-1.5 rounded bg-amber-100 px-1 py-px align-middle text-[9px] font-bold uppercase text-amber-700">
                demo
              </span>
            )}
          </p>
          <p dir="auto" className="truncate text-xs text-slate-600">
            {liveTranscript || 'Say where you want to go…'}
          </p>
        </div>
      </div>
    );
  } else if (processing) {
    body = (
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold text-slate-900">Finding your destination…</p>
        <p className="truncate text-xs text-slate-500">Matching against 100+ places across Jordan</p>
      </div>
    );
  } else {
    body = (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitText(typed);
        }}
      >
        <label htmlFor="destination-input" className="sr-only">
          Where to?
        </label>
        <input
          id="destination-input"
          dir="auto"
          value={typed}
          onChange={(e) => onTypedChange(e.target.value)}
          placeholder="Where to? · وين بدك تروح؟"
          enterKeyHint="search"
          autoComplete="off"
          className="w-full bg-transparent py-2 text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none"
        />
      </form>
    );
  }

  return (
    <section className="rounded-2xl bg-white/95 p-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 backdrop-blur">
      <div className="flex items-center gap-3 px-1 pb-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-petra-600 ring-4 ring-petra-100" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Pickup</p>
          <p className="truncate text-sm font-medium text-slate-700">
            {ORIGIN.name} · {ORIGIN.subtitle}
          </p>
        </div>
        <div role="group" aria-label="Voice language" className="flex shrink-0 rounded-full bg-slate-100 p-0.5">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onLangChange(l.id)}
              disabled={recording}
              aria-pressed={lang === l.id}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                lang === l.id ? 'bg-white text-petra-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`flex items-center gap-3 rounded-xl py-1.5 pl-3 pr-1.5 transition-colors ${
          recording ? 'bg-red-50 ring-1 ring-red-100' : 'bg-slate-50 ring-1 ring-slate-100 focus-within:ring-petra-600'
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
