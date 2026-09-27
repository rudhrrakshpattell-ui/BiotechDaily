import { useEffect, useState } from 'react';
import { INTERESTS, USERNAME_RE } from '../shared.js';
import { isUsernameTaken } from '../data.js';
import { useDebounce } from '../../hooks/useDebounce.js';

// Fields shared by onboarding (with username) and settings (username fixed).
export default function ProfileForm({ initial = {}, withUsername = false, submitLabel, onSubmit, children }) {
  const [f, setF] = useState({
    username: initial.username ?? '',
    display_name: initial.display_name ?? '',
    university: initial.university ?? '',
    program: initial.program ?? '',
    bio: initial.bio ?? '',
    interests: initial.interests ?? [],
  });
  const [state, setState] = useState({ saving: false, error: null, saved: false });
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'ok' | 'taken' | 'invalid'
  const debouncedUsername = useDebounce(f.username, 400);
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    if (!withUsername || !debouncedUsername) return setUsernameStatus(null);
    if (!USERNAME_RE.test(debouncedUsername)) return setUsernameStatus('invalid');
    let live = true;
    setUsernameStatus('checking');
    isUsernameTaken(debouncedUsername).then((taken) => live && setUsernameStatus(taken ? 'taken' : 'ok'), () => live && setUsernameStatus(null));
    return () => { live = false; };
  }, [debouncedUsername, withUsername]);

  const toggleInterest = (i) =>
    setF((prev) => ({
      ...prev,
      interests: prev.interests.includes(i) ? prev.interests.filter((x) => x !== i) : prev.interests.length < 8 ? [...prev.interests, i] : prev.interests,
    }));

  async function submit(e) {
    e.preventDefault();
    setState({ saving: true, error: null, saved: false });
    const error = await onSubmit({ ...f, username: f.username.toLowerCase() });
    setState({ saving: false, error: error ?? null, saved: !error });
  }

  const blocked = withUsername && usernameStatus !== 'ok';
  return (
    <form onSubmit={submit} className="space-y-4">
      {withUsername && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">@</span>
            <input value={f.username} onChange={(e) => setF((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '') }))} required maxLength={20} autoComplete="off" className="input pl-8" placeholder="ada_lovelace" />
          </div>
          <span className={`mt-1 block text-xs ${usernameStatus === 'ok' ? 'text-helix-600' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-rose-600' : 'text-slate-500'}`}>
            {{ ok: 'Available', taken: 'That username is taken', invalid: '3–20 characters: lowercase letters, numbers and _', checking: 'Checking…' }[usernameStatus] ?? 'This is your profile link: biotech-daily.vercel.app/connect/u/…'}
          </span>
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
        <input value={f.display_name} onChange={set('display_name')} required maxLength={60} className="input" placeholder="Your name" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">University or school</span>
          <input value={f.university} onChange={set('university')} maxLength={100} className="input" placeholder="e.g. MIT" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Program</span>
          <input value={f.program} onChange={set('program')} maxLength={100} className="input" placeholder="e.g. BSc Biotechnology, Year 2" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">Bio <span className="text-xs font-normal text-slate-400">{f.bio.length}/280</span></span>
        <textarea value={f.bio} onChange={set('bio')} maxLength={280} rows={3} className="input resize-none" placeholder="What are you studying or working on?" />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Interests <span className="font-normal text-slate-400">(up to 8)</span></legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button type="button" key={i} onClick={() => toggleInterest(i)} aria-pressed={f.interests.includes(i)} className={`chip focus-ring ${f.interests.includes(i) ? 'chip-active' : 'chip-idle'}`}>{i}</button>
          ))}
        </div>
      </fieldset>
      {children}
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      {state.saved && !withUsername && <p className="text-sm text-helix-600">Saved.</p>}
      <button disabled={state.saving || blocked || !f.display_name.trim()} className="focus-ring w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
        {state.saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
