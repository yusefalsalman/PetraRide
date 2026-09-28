import { MOCK_RESPONSES } from '../data/mockResponses';

/** Tappable sample phrases so the demo works without a microphone. */
export default function DemoPhrases({ onPick, disabled }) {
  return (
    <section className="rounded-2xl bg-white/95 p-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 backdrop-blur">
      <p className="text-sm font-semibold text-slate-900">Try saying</p>
      <p className="mb-3 text-xs text-slate-500">Or tap a phrase to simulate a voice request</p>
      <div className="flex flex-wrap gap-2">
        {MOCK_RESPONSES.slice(0, 4).map((sample) => (
          <button
            key={sample.detected_landmark}
            type="button"
            dir="auto"
            disabled={disabled}
            onClick={() => onPick(sample)}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-petra-50 hover:text-petra-900 disabled:opacity-50"
          >
            {sample.transcription}
          </button>
        ))}
      </div>
    </section>
  );
}
