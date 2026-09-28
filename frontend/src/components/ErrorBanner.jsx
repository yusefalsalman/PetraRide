import { CloseIcon } from './Icons';

export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div
      role="alert"
      className="animate-fade-in flex items-start gap-3 rounded-2xl bg-red-50 p-3 text-sm text-red-800 shadow-lg ring-1 ring-red-100"
    >
      <p className="flex-1">{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-red-500 hover:text-red-700">
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
