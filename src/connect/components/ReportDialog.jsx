import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { report } from '../data.js';
import { friendlyError } from '../supabase.js';

const REASONS = [
  ['spam', 'Spam or scam'],
  ['harassment', 'Harassment or bullying'],
  ['inappropriate', 'Inappropriate or explicit content'],
  ['misinformation', 'Dangerous health misinformation'],
  ['impersonation', 'Impersonation'],
  ['other', 'Something else'],
];

export default function ReportDialog({ target, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [state, setState] = useState({ sending: false, done: false, error: null });

  async function submit(e) {
    e.preventDefault();
    setState({ sending: true, done: false, error: null });
    try {
      await report({ ...target, reason, details });
      setState({ sending: false, done: true, error: null });
    } catch (err) {
      setState({ sending: false, done: false, error: friendlyError(err) });
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Report">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-md p-6 shadow-2xl">
        <button onClick={onClose} className="focus-ring absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-slate-700" aria-label="Close"><Icon name="x" className="h-4 w-4" /></button>
        {state.done ? (
          <div className="py-4 text-center">
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Thanks for letting us know</p>
            <p className="mt-2 text-sm text-slate-500">We’ll review this. You can also block this person from their profile.</p>
            <button onClick={onClose} className="focus-ring mt-5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Report {target.commentId ? 'comment' : target.postId ? 'post' : 'profile'}</p>
            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Reason</legend>
              {REASONS.map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-brand-300 dark:border-white/10">
                  <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} />
                  {label}
                </label>
              ))}
            </fieldset>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} rows={3} placeholder="Anything else we should know? (optional)" className="input mt-3 resize-none" />
            {state.error && <p className="mt-2 text-sm text-rose-600">{state.error}</p>}
            <button disabled={!reason || state.sending} className="focus-ring mt-4 w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
              {state.sending ? 'Sending…' : 'Send report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
