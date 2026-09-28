import { CloseIcon } from './Icons';

export default function ErrorBanner({ message, suggestions = [], onPick, onDismiss }) {
  return (
    <div role="alert" className="animate-fade-in rounded-2xl bg-red-50 p-3 text-sm text-red-800 shadow-lg ring-1 ring-red-100">
      <div className="flex items-start gap-3">
        <p dir="auto" className="flex-1">
          {message}
        </p>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-red-500 hover:text-red-700">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => onPick(place)}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-red-800 ring-1 ring-red-200 hover:bg-red-100"
            >
              {place.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
