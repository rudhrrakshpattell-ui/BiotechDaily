import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from './Avatar.jsx';
import Linkified from './Linkified.jsx';
import ReportDialog from './ReportDialog.jsx';
import { deletePost, like, unlike } from '../data.js';
import { timeAgo } from '../../services/format.js';
import { imageProps } from '../../services/images.js';

export default function PostCard({ post, me, liked: initiallyLiked, onDeleted }) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(post.likeCount);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const author = post.author;
  const mine = me && post.author_id === me;

  async function toggleLike() {
    if (!me) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await (next ? like(post.id) : unlike(me, post.id));
    } catch {
      setLiked(!next);
      setCount((c) => c - (next ? 1 : -1));
    }
  }

  async function remove() {
    setMenu(false);
    if (!window.confirm('Delete this post? This can’t be undone.')) return;
    await deletePost(post);
    onDeleted?.(post.id);
  }

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <a href={`/connect/u/${author.username}`} className="focus-ring rounded-full"><Avatar profile={author} /></a>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-sm leading-tight">
              <a href={`/connect/u/${author.username}`} className="font-semibold text-slate-900 hover:underline dark:text-white">{author.display_name}</a>
              <span className="ml-1.5 text-slate-500">@{author.username} · {timeAgo(post.created_at)}</span>
              {(author.program || author.university) && (
                <span className="mt-0.5 block truncate text-xs text-slate-500">{[author.program, author.university].filter(Boolean).join(' · ')}</span>
              )}
            </p>
            {me && (
              <div className="relative">
                <button onClick={() => setMenu((m) => !m)} className="focus-ring rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10" aria-label="Post options" aria-expanded={menu}>•••</button>
                {menu && (
                  <div className="card absolute right-0 z-10 mt-1 w-40 overflow-hidden py-1 text-sm shadow-lg">
                    {mine ? (
                      <button onClick={remove} className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10">Delete post</button>
                    ) : (
                      <button onClick={() => { setMenu(false); setReporting(true); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5">Report post</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800 dark:text-slate-200"><Linkified text={post.body} /></p>
          {post.image_url && (
            <img {...imageProps(post.image_url, [640, 828], '(min-width: 768px) 600px, 100vw')} alt="" loading="lazy" className="mt-3 max-h-[28rem] w-full rounded-xl border border-slate-100 object-cover dark:border-white/5" />
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
            <button onClick={toggleLike} disabled={!me} className={`focus-ring inline-flex items-center gap-1.5 rounded-full px-2 py-1 -ml-2 transition ${liked ? 'text-rose-600' : 'hover:text-rose-600'} disabled:cursor-default`} aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} title={me ? '' : 'Sign in to like posts'}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 20s-7-4.4-9.3-9C1.2 7.8 3 4.5 6.3 4.5c2 0 3.3 1.1 3.9 2.2.6-1.1 1.9-2.2 3.9-2.2 3.3 0 5.1 3.3 3.6 6.5C19 15.6 12 20 12 20Z" /></svg>
              <span className="tabular-nums">{count}</span>
            </button>
          </div>
        </div>
      </div>
      {reporting && <ReportDialog target={{ postId: post.id }} onClose={() => setReporting(false)} />}
    </article>
  );
}
