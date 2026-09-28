import { DEMO_UTTERANCES, JORDAN_PLACES } from '../data/jordanPlaces';

const GOVERNORATES = 12;

/** Tappable sample phrases so the demo also works without a microphone. */
export default function DemoPhrases({ onPick, disabled }) {
  return (
    <section className="rounded-2xl bg-white/95 p-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 backdrop-blur">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Try saying</p>
        <p className="text-[11px] text-slate-500">
          {JORDAN_PLACES.length} places · {GOVERNORATES} governorates
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {DEMO_UTTERANCES.slice(0, 5).map((utterance) => (
          <button
            key={utterance}
            type="button"
            dir="auto"
            disabled={disabled}
            onClick={() => onPick(utterance)}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-petra-50 hover:text-petra-900 disabled:opacity-50"
          >
            {utterance}
          </button>
        ))}
      </div>
    </section>
  );
}
