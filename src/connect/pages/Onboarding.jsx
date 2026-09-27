import { useState } from 'react';
import BirthDatePicker from '../components/BirthDatePicker.jsx';
import ProfileForm from '../components/ProfileForm.jsx';
import { createProfile } from '../data.js';
import { friendlyError, supabase } from '../supabase.js';
import { refreshProfile } from '../session.js';
import { MIN_AGE, clearPendingBirthDate, isAgeBlocked, pendingBirthDate } from '../shared.js';

export default function Onboarding({ session }) {
  const [agreed, setAgreed] = useState(false);
  // Sign-up metadata first, then what this browser remembered from the Join step; otherwise ask here.
  const [birthDate, setBirthDate] = useState(session.user.user_metadata?.birth_date ?? pendingBirthDate());
  const [tooYoung, setTooYoung] = useState(isAgeBlocked() && !birthDate);

  async function submit(fields) {
    if (!agreed) return 'Please agree to the community guidelines.';
    try {
      await createProfile({ ...fields, birth_date: birthDate });
      clearPendingBirthDate();
      await refreshProfile();
      return null;
    } catch (err) {
      return friendlyError(err);
    }
  }

  if (tooYoung) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card p-8">
          <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">Sorry, you can’t join yet</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">BiotechDaily Connect is for students aged {MIN_AGE} and over.</p>
          <button onClick={() => supabase.auth.signOut()} className="focus-ring mt-6 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Sign out</button>
        </div>
      </div>
    );
  }

  if (!birthDate) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className="card p-6 sm:p-8">
          <p className="eyebrow mb-2">One more thing</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">When were you born?</h1>
          <p className="mb-5 mt-2 text-sm text-slate-500">You’re signed in as {session.user.email}. We ask so we can keep younger members safe; it’s never shown on your profile.</p>
          <BirthDatePicker onConfirm={setBirthDate} onTooYoung={() => setTooYoung(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <p className="eyebrow mb-2">Almost there</p>
      <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Set up your profile</h1>
      <p className="mt-2 text-slate-500">Signed in as {session.user.email}. This is how other students will find and recognize you.</p>
      <div className="card mt-6 p-6">
        <ProfileForm withUsername submitLabel="Create my profile" onSubmit={submit}>
          <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
            <span>I’ll follow the <a href="/connect/guidelines" target="_blank" className="font-semibold text-brand-600 underline dark:text-brand-300">community guidelines</a>: be kind, keep it about science and studies, and never share private information.</span>
          </label>
        </ProfileForm>
      </div>
    </div>
  );
}
