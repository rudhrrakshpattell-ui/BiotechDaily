import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from './Avatar.jsx';
import Linkified from './Linkified.jsx';
import ReportDialog from './ReportDialog.jsx';
import { addComment, deleteComment, listComments } from '../data.js';
import { friendlyError } from '../supabase.js';
import { timeAgo } from '../../services/format.js';
import { useSession } from '../session.js';

const MAX = 500;

// Replies under a post. The post's author may remove any comment on it.
export default function CommentThread({ post, me, onCountChange }) {
  const { profile: myProfile } = useSession();
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState({ sending: false, error: null });
  const [reporting, setReporting] = useState(null);

  useEffect(() => {
    let live = true;
    listComments(post.id).then((c) => live && setComments(c), (err) => live && setState({ sending: false, error: friendlyError(err) }));
    return () => { live = false; };
  }, [post.id]);

  async function submit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setState({ sending: true, error: null });
    try {
      const comment = await addComment(me, post.id, draft);
      setComments((prev) => [...(prev ?? []), comment]);
      onCountChange?.(1);
      setDraft('');
      setState({ sending: false, error: null });
    } catch (err) {
      setState({ sending: false, error: friendlyError(err) });
    }
  }

  async function remove(comment) {
    if (!window.confirm('Delete this comment?')) return;
    await deleteComment(comment.id);
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    onCountChange?.(-1);
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/5">
      {comments === null && !state.error && <div className="skeleton h-10" />}
      {comments?.length === 0 && <p className="pb-2 text-sm text-slate-500">No comments yet{me ? '. Start the conversation.' : '.'}</p>}
      <ul className="space-y-3">
        {comments?.map((c) => {
          const canDelete = me && (c.author_id === me || post.author_id === me);
          return (
            <li key={c.id} className="group/comment flex gap-2.5">
              <a href={`/connect/u/${c.author.username}`} className="focus-ring rounded-full"><Avatar profile={c.author} size="sm" className="!h-8 !w-8" /></a>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-slate-100 px-3.5 py-2 dark:bg-white/5">
                  <p className="text-sm leading-tight">
                    <a href={`/connect/u/${c.author.username}`} className="font-semibold text-slate-900 hover:underline dark:text-white">{c.author.display_name}</a>
                    <span className="ml-1.5 text-xs text-slate-500">@{c.author.username} · {timeAgo(c.created_at)}</span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200"><Linkified text={c.body} /></p>
                </div>
                {me && (
                  <div className="mt-0.5 flex gap-3 pl-3 text-xs text-slate-500 opacity-0 transition group-hover/comment:opacity-100 focus-within:opacity-100">
                    {canDelete && <button onClick={() => remove(c)} className="focus-ring rounded hover:text-rose-600">Delete</button>}
                    {c.author_id !== me && <button onClick={() => setReporting(c.id)} className="focus-ring rounded hover:text-slate-800 dark:hover:text-slate-200">Report</button>}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {me ? (
        <form onSubmit={submit} className="mt-3 flex items-start gap-2.5">
          <Avatar profile={myProfile} size="sm" className="!h-8 !w-8" />
          <div className="min-w-0 flex-1">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 focus-within:border-brand-400 dark:border-white/10 dark:bg-ink-900">
              <label htmlFor={`reply-${post.id}`} className="sr-only">Write a comment</label>
              <textarea
                id={`reply-${post.id}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
                rows={1}
                placeholder="Post your reply"
                className="max-h-32 min-h-[1.75rem] flex-1 resize-none bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <button disabled={!draft.trim() || state.sending} className="focus-ring mb-0.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
                {state.sending ? '…' : 'Reply'}
              </button>
            </div>
            {draft.length > MAX - 50 && <p className="mt-1 text-right text-xs text-amber-600">{draft.length}/{MAX}</p>}
          </div>
        </form>
      ) : (
        <p className="mt-3 text-sm text-slate-500"><a href="/connect/join" className="font-semibold text-brand-600 dark:text-brand-300">Join</a> to reply.</p>
      )}
      {state.error && <p className="mt-2 text-sm text-rose-600">{state.error}</p>}
      {reporting && <ReportDialog target={{ commentId: reporting }} onClose={() => setReporting(null)} />}
    </div>
  );
}
