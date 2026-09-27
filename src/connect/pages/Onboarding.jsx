import { useState } from 'react';
import ProfileForm from '../components/ProfileForm.jsx';
import { createProfile } from '../data.js';
import { friendlyError } from '../supabase.js';
import { refreshProfile } from '../session.js';

export default function Onboarding({ session }) {
  const [agreed, setAgreed] = useState(false);
  const birthDate = session.user.user_metadata?.birth_date;

  async function submit(fields) {
    if (!agreed) return 'Please agree to the community guidelines.';
    if (!birthDate) return 'We couldn’t find your date of birth. Please sign up again from the Join page.';
    try {
      await createProfile({ ...fields, birth_date: birthDate });
      await refreshProfile();
      return null;
    } catch (err) {
      return friendlyError(err);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <p className="eyebrow mb-2">Almost there</p>
      <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Set up your profile</h1>
      <p className="mt-2 text-slate-500">This is how other students will find and recognize you.</p>
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
