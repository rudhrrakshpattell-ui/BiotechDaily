import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Avatar from './Avatar.jsx';
import CommentThread from './CommentThread.jsx';
import Linkified from './Linkified.jsx';
import ReportDialog from './ReportDialog.jsx';
import { deletePost, like, unlike, updatePost } from '../data.js';
import { friendlyError } from '../supabase.js';
import { timeAgo } from '../../services/format.js';
import { imageProps } from '../../services/images.js';
import { formatNumber } from '../../services/format.js';

const MAX = 1000;

// One action in the bottom row: icon in a circle that tints on hover, plus a count.
function Action({ icon, label, count, active, tone, onClick, disabled }) {
  const tones = {
    brand: 'hover:text-brand-600 [&:hover_.circle]:bg-brand-500/10',
    rose: 'hover:text-rose-600 [&:hover_.circle]:bg-rose-500/10',
    helix: 'hover:text-helix-600 [&:hover_.circle]:bg-helix-500/10',
  };
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`focus-ring group/action -ml-2 inline-flex items-center gap-1 rounded-full text-[13px] tabular-nums transition disabled:cursor-default ${active ? (tone === 'rose' ? 'text-rose-600' : 'text-brand-600') : 'text-slate-500'} ${disabled ? '' : tones[tone]}`}>
      <span className="circle grid h-8 w-8 place-items-center rounded-full transition"><Icon name={icon} className="h-[18px] w-[18px]" /></span>
      {count !== undefined && <span className="min-w-[1ch]">{count > 0 ? formatNumber(count) : ''}</span>}
    </button>
  );
}

export default function PostCard({ post: initialPost, me, liked: initiallyLiked, onDeleted, expanded = false }) {
  const [post, setPost] = useState(initialPost);
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(initialPost.likeCount);
  const [commentCount, setCommentCount] = useState(initialPost.commentCount ?? 0);
  const [showComments, setShowComments] = useState(expanded);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialPost.body);
  const [saveState, setSaveState] = useState({ saving: false, error: null });
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const author = post.author;
  const mine = me && post.author_id === me;
  const link = `${window.location.origin}/connect/p/${post.id}`;

  async function toggleLike() {
    if (!me) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await (next ? like(post.id) : unlike(me, post.id));
    } catch {
      setLiked(!next);
      setLikeCount((c) => c - (next ? 1 : -1));
    }
  }

  async function share() {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: `${author.display_name} on BiotechDaily Connect`, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  function startEditing() {
    setMenu(false);
    setDraft(post.body);
    setSaveState({ saving: false, error: null });
    setEditing(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (draft.trim() === post.body) return setEditing(false);
    setSaveState({ saving: true, error: null });
    try {
      const updated = await updatePost(post.id, draft);
      setPost((p) => ({ ...p, ...updated }));
      setEditing(false);
      setSaveState({ saving: false, error: null });
    } catch (err) {
      setSaveState({ saving: false, error: friendlyError(err) });
    }
  }

  async function remove() {
    setMenu(false);
    if (!window.confirm('Delete this post? This can’t be undone.')) return;
    await deletePost(post);
    onDeleted?.(post.id);
  }

  return (
    <article className="flex gap-3 px-4 py-4 transition hover:bg-slate-50/70 sm:px-5 dark:hover:bg-white/[0.02]">
      <a href={`/connect/u/${author.username}`} className="focus-ring h-fit shrink-0 rounded-full"><Avatar profile={author} /></a>

      <div className="min-w-0 flex-1">
        {/* name · @handle · time                                  ••• */}
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 truncate text-[15px] leading-5">
            <a href={`/connect/u/${author.username}`} className="font-bold text-slate-900 hover:underline dark:text-white">{author.display_name}</a>
            <span className="ml-1 text-slate-500">
              @{author.username} · <a href={`/connect/p/${post.id}`} className="hover:underline" title={new Date(post.created_at).toLocaleString()}>{timeAgo(post.created_at)}</a>
              {post.edited_at && <span title={`Edited ${new Date(post.edited_at).toLocaleString()}`}> · edited</span>}
            </span>
          </p>
          {me && (
            <div className="relative -mr-2 -mt-1.5">
              <button onClick={() => setMenu((m) => !m)} className="focus-ring grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-brand-500/10 hover:text-brand-600" aria-label="Post options" aria-expanded={menu}>
                <Icon name="more" className="h-4 w-4" />
              </button>
              {menu && (
                <div className="card absolute right-0 z-10 mt-1 w-44 overflow-hidden py-1 text-sm shadow-lg">
                  {mine ? (
                    <>
                      <button onClick={startEditing} className="block w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5">Edit post</button>
                      <button onClick={remove} className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10">Delete post</button>
                    </>
                  ) : (
                    <button onClick={() => { setMenu(false); setReporting(true); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5">Report post</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {(author.program || author.university) && (
          <p className="truncate text-xs text-slate-500">{[author.program, author.university].filter(Boolean).join(' · ')}</p>
        )}

        {editing ? (
          <form onSubmit={saveEdit} className="mt-2">
            <label htmlFor={`edit-${post.id}`} className="sr-only">Edit post</label>
            <textarea
              id={`edit-${post.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
              onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
              rows={Math.min(10, Math.max(3, draft.split('\n').length + 1))}
              autoFocus
              className="input resize-none text-[15px]"
            />
            {saveState.error && <p className="mt-1 text-sm text-rose-600">{saveState.error}</p>}
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className={`mr-auto text-xs tabular-nums ${draft.length > MAX - 50 ? 'text-amber-600' : 'text-slate-400'}`}>{draft.length}/{MAX}</span>
              <button type="button" onClick={() => setEditing(false)} className="focus-ring rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Cancel</button>
              <button disabled={!draft.trim() || saveState.saving} className="focus-ring rounded-full bg-brand-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                {saveState.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-slate-900 dark:text-slate-100"><Linkified text={post.body} /></p>
        )}

        {post.image_url && (
          <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
            <img {...imageProps(post.image_url, [640, 828], '(min-width: 768px) 560px, 100vw')} alt="" loading="lazy" className="max-h-[32rem] w-full object-cover" />
          </a>
        )}

        <div className="mt-2 flex max-w-md items-center justify-between pr-4">
          <Action icon="message" label={showComments ? 'Hide replies' : 'Reply'} count={commentCount} tone="brand" active={showComments} onClick={() => setShowComments((s) => !s)} />
          <Action icon={liked ? 'heartFilled' : 'heart'} label={me ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'} count={likeCount} tone="rose" active={liked} onClick={toggleLike} disabled={!me} />
          <span className="relative">
            <Action icon="share" label="Share" tone="helix" onClick={share} />
            {copied && <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-950 px-2 py-1 text-xs text-white">Link copied</span>}
          </span>
        </div>

        {showComments && <CommentThread post={post} me={me} onCountChange={(d) => setCommentCount((c) => c + d)} />}
      </div>
      {reporting && <ReportDialog target={{ postId: post.id }} onClose={() => setReporting(false)} />}
    </article>
  );
}
