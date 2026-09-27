import { useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from './Avatar.jsx';
import { createPost } from '../data.js';
import { friendlyError } from '../supabase.js';

const MAX = 1000;
const MAX_IMAGE = 5 * 1024 * 1024;

export default function Composer({ profile, onPosted }) {
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [state, setState] = useState({ posting: false, error: null });
  const fileRef = useRef(null);

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

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setState({ posting: true, error: null });
    try {
      const post = await createPost(profile.id, { body, image });
      setBody('');
      setImage(null);
      setPreview(null);
      setState({ posting: false, error: null });
      onPosted?.(post);
    } catch (err) {
      setState({ posting: false, error: friendlyError(err) });
    }
  }

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <div className="flex gap-3">
        <Avatar profile={profile} />
        <div className="min-w-0 flex-1">
          <label htmlFor="composer" className="sr-only">Write a post</label>
          <textarea
            id="composer"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX))}
            rows={3}
            placeholder="Share a paper, a lab win, a question for fellow students…"
            className="w-full resize-none bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          {preview && (
            <div className="relative mt-2 inline-block">
              <img src={preview} alt="Selected image" className="max-h-48 rounded-xl" />
              <button type="button" onClick={() => { setImage(null); setPreview(null); }} className="focus-ring absolute right-2 top-2 rounded-full bg-ink-950/70 p-1 text-white" aria-label="Remove image"><Icon name="x" className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {state.error && <p className="mt-2 text-sm text-rose-600">{state.error}</p>}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickImage} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} className="focus-ring rounded-lg px-2 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-400/10">Add image</button>
              <span className={`text-xs tabular-nums ${body.length > MAX - 50 ? 'text-amber-600' : 'text-slate-400'}`}>{body.length}/{MAX}</span>
            </div>
            <button disabled={!body.trim() || state.posting} className="focus-ring rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
              {state.posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
