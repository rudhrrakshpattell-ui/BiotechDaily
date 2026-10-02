import { useEffect, useState } from 'react';
import { follow, isFollowing, unfollow } from '../data.js';

export default function FollowButton({ me, id, small = false, onChange }) {
  const [following, setFollowing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    isFollowing(me, id).then((f) => live && setFollowing(f), () => live && setFollowing(false));
    return () => { live = false; };
  }, [me, id]);

  async function toggle() {
    setBusy(true);
    try {
      await (following ? unfollow(me, id) : follow(me, id));
      setFollowing(!following);
      onChange?.(!following);
    } finally {
      setBusy(false);
    }
  }

  if (following === null) return <span className={`skeleton ${small ? 'h-8 w-20' : 'h-10 w-28'}`} />;
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`focus-ring shrink-0 rounded-full font-semibold transition disabled:opacity-60 ${small ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2 text-sm'} ${
        following
          ? 'border border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600 dark:border-white/15 dark:text-slate-200'
          : 'bg-brand-600 text-white hover:bg-brand-700'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
