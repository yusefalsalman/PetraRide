export default function AppHeader({ source }) {
  return (
    <header className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-petra-900 text-sm font-extrabold text-white shadow-md">
          PR
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-slate-900">Petra Ride</p>
          <p className="text-[11px] font-medium text-petra-600">with PetraVoice</p>
        </div>
      </div>
      {source && (
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${
            source === 'api' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
          title={source === 'api' ? 'Answered by the PetraVoice API' : 'Backend offline — using demo data'}
        >
          {source === 'api' ? 'Live AI' : 'Demo data'}
        </span>
      )}
    </header>
  );
}
