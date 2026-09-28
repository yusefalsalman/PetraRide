import { PinIcon, SparkleIcon } from './Icons';

function confidenceTone(c) {
  if (c >= 0.9) return 'bg-emerald-50 text-emerald-700';
  if (c >= 0.75) return 'bg-amber-50 text-amber-700';
  return 'bg-orange-50 text-orange-700';
}

/** What the rider said, what PetraVoice matched, and close alternatives. */
export default function TranscriptionCard({ result, onPickAlternative, disabled }) {
  const confidence = typeof result.confidence === 'number' ? result.confidence : null;
  const alternatives = result.alternatives || [];

  return (
    <section className="animate-fade-in rounded-2xl bg-white/95 p-3.5 shadow-lg shadow-slate-900/10 ring-1 ring-slate-100 backdrop-blur">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-petra-600">
          <SparkleIcon className="h-3.5 w-3.5" /> You said
        </p>
        {confidence !== null && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${confidenceTone(confidence)}`}>
            {Math.round(confidence * 100)}% match
          </span>
        )}
      </div>
      <blockquote
        dir="auto"
        className="border-s-2 border-petra-100 ps-2.5 text-[15px] font-medium leading-snug text-slate-800"
      >
        {result.transcription || '…'}
      </blockquote>
      <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500">
        <PinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-petra-900" />
        <p className="min-w-0">
          <span className="font-semibold text-petra-900">{result.detected_landmark}</span>
          {result.name_ar && (
            <>
              {' · '}
              <bdi className="text-slate-500">{result.name_ar}</bdi>
            </>
          )}
          {(result.city || result.category) && (
            <span className="block text-[11px] text-slate-400">
              {[result.category, result.city].filter(Boolean).join(' · ')}
            </span>
          )}
        </p>
      </div>
      {alternatives.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Did you mean</span>
          {alternatives.map((place) => (
            <button
              key={place.id}
              type="button"
              disabled={disabled}
              onClick={() => onPickAlternative(place)}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-petra-50 hover:text-petra-900 disabled:opacity-50"
            >
              {place.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
