import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PostCard from '../components/PostCard.jsx';
import { getPost, likedPostIds } from '../data.js';
import { SkeletonList } from '../../components/ui.jsx';
import { navigate } from '../../hooks/useRoute.js';

// A single post with its replies open: the target of "Share" links.
export default function PostPage({ id, me }) {
  const [post, setPost] = useState(undefined);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let live = true;
    getPost(id).then(async (p) => {
      if (!live) return;
      setPost(p);
      if (p && me) setLiked((await likedPostIds(me, [p.id])).has(p.id));
    }, () => live && setPost(null));
    return () => { live = false; };
  }, [id, me]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <button onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/connect'))} className="focus-ring mb-4 inline-flex items-center gap-1 rounded text-sm font-medium text-slate-500 hover:text-brand-600">
        <Icon name="chevronLeft" className="h-4 w-4" /> Back
      </button>
      {post === undefined && <SkeletonList count={1} className="h-48" />}
      {post === null && (
        <div className="card px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">This post isn’t available</p>
          <p className="mt-2 text-sm text-slate-500">It may have been deleted, or it’s only visible to members.</p>
          <a href={me ? '/connect' : '/connect/join'} className="focus-ring mt-5 inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white">{me ? 'Back to Connect' : 'Join Connect'}</a>
        </div>
      )}
      {post && (
        <div className="card overflow-hidden">
          <PostCard key={`${post.id}-${liked}`} post={post} me={me} liked={liked} expanded onDeleted={() => navigate('/connect')} />
        </div>
      )}
    </div>
  );
}
