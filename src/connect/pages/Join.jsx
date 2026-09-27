import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { supabase, friendlyError } from '../supabase.js';
import { MIN_AGE, isAgeBlocked, savePendingBirthDate } from '../shared.js';
import BirthDatePicker from '../components/BirthDatePicker.jsx';


// mode 'signin': returning members skip the age step, and no new account can be created that way.
export default function Join({ mode }) {
  const signIn = mode === 'signin';
  const [step, setStep] = useState(isAgeBlocked() && !signIn ? 'blocked' : signIn ? 'email' : 'age');
  const [birthDate, setBirthDate] = useState(null);
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ sending: false, error: null });
  async function sendLink(e) {
    e.preventDefault();
    setState({ sending: true, error: null });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: signIn
        ? { emailRedirectTo: `${window.location.origin}/connect`, shouldCreateUser: false }
        : { emailRedirectTo: `${window.location.origin}/connect`, data: { birth_date: birthDate } },
    });
    if (error) {
      const noAccount = signIn && /signups? not allowed|not found/i.test(error.message);
      return setState({ sending: false, error: noAccount ? 'No account uses that email yet. Join Connect instead.' : friendlyError(error) });
    }
    setState({ sending: false, error: null });
    setStep('sent');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="card p-6 sm:p-8">
        {step === 'blocked' && (
          <div className="text-center">
            <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">Sorry, you can’t join yet</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              BiotechDaily Connect is for students aged {MIN_AGE} and over. You can still read all the news, videos and podcasts on BiotechDaily.
            </p>
            <a href="/" className="focus-ring mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Go to BiotechDaily</a>
          </div>
        )}

        {step === 'age' && (
          <div>
            <p className="eyebrow mb-2">Join Connect</p>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">When were you born?</h1>
            <p className="mt-2 mb-5 text-sm text-slate-500">We ask so we can keep younger members safe. Your birth date is never shown on your profile.</p>
            <BirthDatePicker onTooYoung={() => setStep('blocked')} onConfirm={(d) => { setBirthDate(d); savePendingBirthDate(d); setStep('email'); }}>
              <p className="mt-4 text-center text-sm text-slate-500">Already a member? <a href="/connect/join?mode=signin" className="font-semibold text-brand-600 dark:text-brand-300">Sign in</a></p>
            </BirthDatePicker>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={sendLink}>
            <p className="eyebrow mb-2">{signIn ? 'Welcome back' : 'Join Connect'}</p>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">{signIn ? 'Sign in' : 'What’s your email?'}</h1>
            <p className="mt-2 text-sm text-slate-500">We’ll email you a sign-in link. No password needed.</p>
            <label className="mt-5 block">
              <span className="sr-only">Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" className="input" />
            </label>
            {state.error && <p className="mt-2 text-sm text-rose-600">{state.error}</p>}
            <button disabled={state.sending} className="focus-ring mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
              {state.sending ? 'Sending…' : 'Email me a sign-in link'}
            </button>
            <p className="mt-4 text-center text-sm text-slate-500">
              {signIn ? <>New here? <a href="/connect/join" className="font-semibold text-brand-600 dark:text-brand-300">Join Connect</a></> : <>Already a member? <a href="/connect/join?mode=signin" className="font-semibold text-brand-600 dark:text-brand-300">Sign in</a></>}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              By continuing you agree to the <a href="/connect/guidelines" className="font-medium text-brand-600 underline dark:text-brand-300">community guidelines</a>.
            </p>
          </form>
        )}

        {step === 'sent' && (
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-helix-500/10 text-helix-600"><Icon name="sparkles" /></div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900 dark:text-white">Check your inbox</h1>
            <p className="mt-2 text-sm text-slate-500">We sent a sign-in link to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>. Open it on this device to continue.</p>
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
              <span className="font-semibold">Can’t find it?</span> Check your <span className="font-semibold">Spam</span> or <span className="font-semibold">Promotions</span> folder for an email from BiotechDaily, and mark it “Not spam” so future emails arrive in your inbox. It can take a couple of minutes.
            </p>
            <button onClick={() => setStep('email')} className="focus-ring mt-5 text-sm font-semibold text-brand-600 dark:text-brand-300">Use a different email</button>
          </div>
        )}
      </div>
    </div>
  );
}
