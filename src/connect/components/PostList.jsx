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
  if (!posts) return <div className="space-y-4"><SkeletonList count={3} className="h-32" /></div>;
  if (!posts.length) return empty;
  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} me={me} liked={liked.has(p.id)} onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />
        ))}
      </div>
      {more && (
        <button onClick={() => load(posts.at(-1).created_at)} className="focus-ring block w-full border-t border-slate-100 py-3 text-sm font-semibold text-brand-600 hover:bg-slate-50 dark:border-white/[0.06] dark:text-brand-300 dark:hover:bg-white/[0.02]">Show more posts</button>
      )}
    </div>
  );
}
