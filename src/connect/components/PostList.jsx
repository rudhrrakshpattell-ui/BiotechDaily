import { useCallback, useEffect, useState } from 'react';
import PostCard from './PostCard.jsx';
import { PAGE_SIZE, likedPostIds, listPosts } from '../data.js';
import { SkeletonList } from '../../components/ui.jsx';

// Paginated posts for a feed ('following' | 'discover') or one author. `prepend` adds a just-created post.
export default function PostList({ feed, authorId, me, prepend, empty }) {
  const [posts, setPosts] = useState(null);
  const [liked, setLiked] = useState(new Set());
  const [more, setMore] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (before) => {
    try {
      const page = await listPosts({ feed, authorId, me, before });
      const likes = await likedPostIds(me, page.map((p) => p.id));
      setPosts((prev) => (before ? [...(prev ?? []), ...page] : page));
      setLiked((prev) => new Set([...(before ? prev : []), ...likes]));
      setMore(page.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [feed, authorId, me]);

  useEffect(() => { setPosts(null); load(); }, [load]);
  useEffect(() => { if (prepend) setPosts((prev) => [prepend, ...(prev ?? []).filter((p) => p.id !== prepend.id)]); }, [prepend]);

  if (error) return <p className="card p-6 text-sm text-rose-600">Couldn’t load posts: {error}</p>;
  if (!posts) return <div className="space-y-4"><SkeletonList count={3} className="h-36" /></div>;
  if (!posts.length) return empty;
  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} me={me} liked={liked.has(p.id)} onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />
      ))}
      {more && (
        <div className="text-center">
          <button onClick={() => load(posts.at(-1).created_at)} className="focus-ring rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200">Load more</button>
        </div>
      )}
    </div>
  );
}
