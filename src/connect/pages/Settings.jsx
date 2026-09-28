import { useRef, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import ProfileForm from '../components/ProfileForm.jsx';
import DnaAvatarPicker from '../components/DnaAvatarPicker.jsx';
import { deleteAccount, setAvatar, setDnaAvatar, updateProfile } from '../data.js';
import { defaultDnaAvatar, dnaAvatarId } from '../dnaAvatars.js';
import { friendlyError, supabase } from '../supabase.js';
import { refreshProfile } from '../session.js';
import { navigate } from '../../hooks/useRoute.js';

export default function Settings({ profile }) {
  const fileRef = useRef(null);
  const [avatarState, setAvatarState] = useState({ busy: false, error: null });
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  // What the avatar shows now: a chosen DNA style, the default one for members without a picture, or a photo.
  const hasPhoto = Boolean(profile.avatar_url) && !dnaAvatarId(profile.avatar_url);
  const currentDna = dnaAvatarId(profile.avatar_url) ?? defaultDnaAvatar(profile.id);

  async function save({ display_name, university, program, bio, interests }) {
    try {
      await updateProfile(profile.id, { display_name: display_name.trim(), university: university.trim() || null, program: program.trim() || null, bio: bio.trim() || null, interests });
      await refreshProfile();
      return null;
    } catch (err) {
      return friendlyError(err);
    }
  }

  async function pickAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setAvatarState({ busy: false, error: 'Use a JPG, PNG or WebP image.' });
    if (file.size > 2 * 1024 * 1024) return setAvatarState({ busy: false, error: 'Photos must be under 2 MB.' });
    setAvatarState({ busy: true, error: null });
    try {
      await setAvatar(profile.id, file, profile.avatar_url);
      await refreshProfile();
      setAvatarState({ busy: false, error: null });
    } catch (err) {
      setAvatarState({ busy: false, error: friendlyError(err) });
    }
  }

  async function pickDna(style) {
    if (style === currentDna && !hasPhoto) return;
    setAvatarState({ busy: true, error: null });
    try {
      await setDnaAvatar(profile.id, style, profile.avatar_url);
      await refreshProfile();
      setAvatarState({ busy: false, error: null });
    } catch (err) {
      setAvatarState({ busy: false, error: friendlyError(err) });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/connect');
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteAccount(profile.id);
      navigate('/connect');
    } catch (err) {
      setDeleting(false);
      window.alert(friendlyError(err));
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Settings</h1>

      <section className="card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900 dark:text-white">Profile picture</h2>
        <div className="flex items-center gap-5">
          <Avatar profile={profile} size="lg" />
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickAvatar} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={avatarState.busy} className="focus-ring rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 disabled:opacity-50 dark:border-white/10 dark:text-slate-200">
              {avatarState.busy ? 'Saving…' : hasPhoto ? 'Change photo' : 'Upload your own photo'}
            </button>
            <p className="mt-2 text-xs text-slate-500">JPG, PNG or WebP, up to 2 MB. Visible on your profile.</p>
          </div>
        </div>
        <p className="mb-3 mt-6 text-sm font-medium text-slate-700 dark:text-slate-300">Or pick a DNA strand</p>
        <DnaAvatarPicker value={hasPhoto ? null : currentDna} onChange={pickDna} disabled={avatarState.busy} />
        {avatarState.error && <p className="mt-3 text-sm text-rose-600">{avatarState.error}</p>}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900 dark:text-white">Profile</h2>
        <p className="mb-4 text-sm text-slate-500">Username: <span className="font-semibold text-slate-700 dark:text-slate-200">@{profile.username}</span></p>
        <ProfileForm initial={profile} submitLabel="Save changes" onSubmit={save} />
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Account</h2>
        <button onClick={signOut} className="focus-ring rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">Sign out</button>
        <div className="rounded-xl border border-rose-200 p-4 dark:border-rose-400/20">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Delete account</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Permanently deletes your profile, posts, photos, follows and likes. This can’t be undone.</p>
          <label className="mt-3 block text-sm text-slate-600 dark:text-slate-400">
            Type <span className="font-semibold">{profile.username}</span> to confirm
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input mt-1" autoComplete="off" />
          </label>
          <button onClick={remove} disabled={confirm !== profile.username || deleting} className="focus-ring mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40">
            {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </section>
    </div>
  );
}
