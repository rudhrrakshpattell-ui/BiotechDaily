import { DNA_AVATARS, dnaAvatarSrc } from '../dnaAvatars.js';

// A row of DNA profile pictures; `value` is the selected style id (or null when a photo is in use).
export default function DnaAvatarPicker({ value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" aria-label="DNA profile picture" className="grid grid-cols-4 gap-3 sm:grid-cols-8">
      {DNA_AVATARS.map((a) => {
        const selected = value === a.id;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={a.label}
            title={a.label}
            disabled={disabled}
            onClick={() => onChange(a.id)}
            className={`focus-ring aspect-square rounded-full p-0.5 transition disabled:opacity-50 ${
              selected ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-white dark:ring-brand-300 dark:ring-offset-ink-900' : 'hover:scale-105'
            }`}
          >
            <img src={dnaAvatarSrc(a.id)} alt="" className="h-full w-full rounded-full" />
          </button>
        );
      })}
    </div>
  );
}
