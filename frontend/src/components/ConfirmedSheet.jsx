import { CheckIcon, PhoneIcon } from './Icons';

export default function ConfirmedSheet({ trip, onDone }) {
  return (
    <section
      role="status"
      aria-live="assertive"
      className="animate-slide-up rounded-t-3xl bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)]"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
          <CheckIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Trip Confirmed!</h2>
          <p className="text-sm text-slate-500">Driver on the way · arriving in {trip.pickupMinutes} min</p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-petra-900 text-sm font-bold text-white">
          {trip.driver.initials}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-semibold text-slate-900">
            {trip.driver.name} <span className="font-normal text-slate-500">★ {trip.driver.rating}</span>
          </p>
          <p className="text-xs text-slate-500">
            {trip.driver.car} · {trip.tierName}
          </p>
        </div>
        <span className="rounded-lg bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
          {trip.driver.plate}
        </span>
      </div>

      <dl className="mb-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Destination</dt>
          <dd className="max-w-[60%] truncate font-medium text-slate-900">{trip.destination}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Fare</dt>
          <dd className="font-medium text-slate-900">{trip.fare}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Trip ID</dt>
          <dd className="font-mono text-xs font-medium text-slate-900">{trip.id}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-semibold text-slate-800 hover:bg-slate-200"
        >
          <PhoneIcon className="h-4 w-4" /> Contact driver
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-2xl bg-petra-900 text-sm font-semibold text-white hover:bg-petra-700"
        >
          Done
        </button>
      </div>
    </section>
  );
}
