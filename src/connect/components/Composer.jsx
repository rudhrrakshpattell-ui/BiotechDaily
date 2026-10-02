import { useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from './Avatar.jsx';
import { createPost } from '../data.js';
import { friendlyError } from '../supabase.js';

const MAX = 1000;
const MAX_IMAGE = 5 * 1024 * 1024;

// Remaining-characters ring, as on X: fills as you type, turns amber then red near the limit.
function CharRing({ length }) {
  const left = MAX - length;
  const r = 9, c = 2 * Math.PI * r, pct = Math.min(length / MAX, 1);
  const color = left <= 0 ? '#e11d48' : left <= 50 ? '#d97706' : '#1c64ed';
  if (!length) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-slate-500">
      {left <= 50 && <span className={left <= 0 ? 'text-rose-600' : 'text-amber-600'}>{left}</span>}
      <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90" aria-hidden="true">
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
        <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function Composer({ profile, onPosted }) {
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [state, setState] = useState({ posting: false, error: null });
  const fileRef = useRef(null);
  const textRef = useRef(null);

  function pickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return setState({ posting: false, error: 'Images must be JPG, PNG, WebP or GIF.' });
    if (file.size > MAX_IMAGE) return setState({ posting: false, error: 'Images must be under 5 MB.' });
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setState({ posting: false, error: null });
  }

  // Grow the textarea with its content.
  function onInput(e) {
    setBody(e.target.value.slice(0, MAX));
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setState({ posting: true, error: null });
    try {
      const post = await createPost(profile.id, { body, image });
      setBody('');
      setImage(null);
      setPreview(null);
      if (textRef.current) textRef.current.style.height = 'auto';
      setState({ posting: false, error: null });
      onPosted?.(post);
    } catch (err) {
      setState({ posting: false, error: friendlyError(err) });
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-3 px-4 pb-3 pt-4 sm:px-5">
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1">
        <label htmlFor="composer" className="sr-only">Write a post</label>
        <textarea
          ref={textRef}
          id="composer"
          value={body}
          onChange={onInput}
          rows={2}
          placeholder="What’s happening in your lab?"
          className="block w-full resize-none bg-transparent py-1.5 text-[19px] leading-snug text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        />
        {preview && (
          <div className="relative mt-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
            <img src={preview} alt="Selected image" className="max-h-80 w-full object-cover" />
            <button type="button" onClick={() => { setImage(null); setPreview(null); }} className="focus-ring absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink-950/75 text-white backdrop-blur hover:bg-ink-950" aria-label="Remove image"><Icon name="x" className="h-4 w-4" /></button>
          </div>
        )}
        {state.error && <p className="mt-2 text-sm text-rose-600">{state.error}</p>}
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5 dark:border-white/[0.06]">
          <div className="-ml-2 flex items-center">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickImage} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="focus-ring grid h-9 w-9 place-items-center rounded-full text-brand-600 hover:bg-brand-500/10 dark:text-brand-300" aria-label="Add image" title="Add image">
              <Icon name="image" className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <CharRing length={body.length} />
            <button disabled={!body.trim() || state.posting} className="focus-ring rounded-full bg-brand-600 px-5 py-2 text-[15px] font-bold text-white hover:bg-brand-700 disabled:opacity-50">
              {state.posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
