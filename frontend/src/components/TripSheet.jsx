import { useMemo } from 'react';
import { ORIGIN } from '../config';
import { ROAD_FACTOR, VEHICLE_TIERS, arrivalClock, distanceKm, fareForTier, formatDuration } from '../utils/trip';
import { ClockIcon, PinIcon, ShieldIcon, Spinner, WalletIcon } from './Icons';

/**
 * SAFETY GATE: the booking sheet. Nothing is dispatched until the rider
 * physically taps "Confirm Ride". Voice recognition only pre-fills this form.
 */
export default function TripSheet({ result, roadRoute, tierId, onTierChange, onConfirm, onRetry, confirming }) {
  const tier = VEHICLE_TIERS.find((t) => t.id === tierId) ?? VEHICLE_TIERS[0];
  const km = useMemo(
    () => result.distance_km ?? distanceKm(ORIGIN, result.coordinates) * ROAD_FACTOR,
    [result.distance_km, result.coordinates],
  );

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="trip-sheet-title"
      className="animate-slide-up rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)]"
    >
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />

      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-petra-50 text-petra-900">
          <PinIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Destination</p>
          <h2 id="trip-sheet-title" className="line-clamp-2 text-lg font-bold leading-tight text-slate-900">
            {result.detected_landmark}
          </h2>
          <p className="text-xs text-slate-500">
            {result.city && `${result.city} · `}
            {km < 100 ? km.toFixed(1) : Math.round(km)} km {roadRoute ? 'by road' : 'est.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={confirming}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-petra-600 ring-1 ring-petra-100 transition hover:bg-petra-50 disabled:opacity-50"
        >
          Speak again
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <WalletIcon className="h-3.5 w-3.5" /> Estimated fare
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-900">{fareForTier(result.estimated_fare, tier)}</p>
          <p className="text-[11px] text-slate-500">{tier.name}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <ClockIcon className="h-3.5 w-3.5" /> Arrival
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-900">
            {formatDuration(result.eta_minutes)}
          </p>
          <p className="text-[11px] text-slate-500">Arrive ~{arrivalClock(result.eta_minutes)}</p>
        </div>
      </div>

      <fieldset className="mb-3">
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Vehicle tier</legend>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_TIERS.map((t) => {
            const selected = t.id === tier.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTierChange(t.id)}
                disabled={confirming}
                aria-pressed={selected}
                title={`${t.name} · ${t.seats} seats`}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left ring-1 transition ${
                  selected ? 'bg-petra-50 ring-2 ring-petra-600' : 'bg-white ring-slate-200 hover:ring-slate-300'
                }`}
              >
                <span className="text-lg" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-xs font-semibold text-slate-900">{t.name.replace('Petra ', '')}</span>
                  <span className="block text-[11px] text-slate-500">{fareForTier(result.estimated_fare, t)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
        <ShieldIcon className="h-4 w-4 shrink-0" />
        PetraVoice never books automatically. Check the details, then tap Confirm Ride.
      </p>

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-petra-900 text-base font-bold text-white shadow-lg shadow-petra-900/30 transition hover:bg-petra-700 active:scale-[0.99] disabled:opacity-80"
      >
        {confirming ? (
          <>
            <Spinner /> Requesting driver…
          </>
        ) : (
          `Confirm Ride · ${fareForTier(result.estimated_fare, tier)}`
        )}
      </button>
    </section>
  );
}
