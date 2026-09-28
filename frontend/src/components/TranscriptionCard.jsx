import { PinIcon, SparkleIcon } from './Icons';

/** Shows what the rider said and which landmark PetraVoice matched. */
export default function TranscriptionCard({ result }) {
  return (
    <section className="animate-fade-in rounded-2xl bg-white/95 p-3.5 shadow-lg shadow-slate-900/10 ring-1 ring-slate-100 backdrop-blur">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-petra-600">
        <SparkleIcon className="h-3.5 w-3.5" /> You said
      </p>
      <blockquote
        dir="auto"
        className="border-s-2 border-petra-100 ps-2.5 text-[15px] font-medium leading-snug text-slate-800"
      >
        {result.transcription || '…'}
      </blockquote>
      <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
        <PinIcon className="h-3.5 w-3.5 shrink-0 text-petra-900" />
        <span className="whitespace-nowrap">Detected landmark:</span>
        <span className="truncate font-semibold text-petra-900">{result.detected_landmark}</span>
      </p>
    </section>
  );
}
