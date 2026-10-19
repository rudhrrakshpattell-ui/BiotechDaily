import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { supabase, friendlyError, providerEnabled } from '../supabase.js';
import { MIN_AGE, isAgeBlocked, savePendingBirthDate } from '../shared.js';
import BirthDatePicker from '../components/BirthDatePicker.jsx';


// mode 'signin': returning members skip the age step, and no new account can be created that way.
export default function Join({ mode }) {
  const signIn = mode === 'signin';
  const [step, setStep] = useState(isAgeBlocked() && !signIn ? 'blocked' : signIn ? 'email' : 'age');
  const [birthDate, setBirthDate] = useState(null);
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ sending: false, error: null });
  // null while checking; Google is the main way in once it's switched on in Supabase, with email as a fallback.
  const [google, setGoogle] = useState(null);
  const [useEmail, setUseEmail] = useState(false);
  useEffect(() => { providerEnabled('google').then(setGoogle); }, []);

  async function continueWithGoogle() {
    setState({ sending: true, error: null });
    // New members' birth date is already saved in this browser (savePendingBirthDate); onboarding picks it up.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/connect`, queryParams: { prompt: 'select_account' } },
    });
    if (error) setState({ sending: false, error: friendlyError(error) });
  }

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
              Connect is for students aged {MIN_AGE} and over. You can still read all the news, videos and podcasts on Spill the Genes.
            </p>
            <a href="/" className="focus-ring mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Go to Spill the Genes</a>
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

        {step === 'email' && google === null && <div className="space-y-3" aria-busy="true"><div className="skeleton h-8 w-40" /><div className="skeleton h-12" /></div>}

        {step === 'email' && google && !useEmail && (
          <div>
            <p className="eyebrow mb-2">{signIn ? 'Welcome back' : 'Join Connect'}</p>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">{signIn ? 'Sign in' : 'One tap and you’re in'}</h1>
            <p className="mt-2 text-sm text-slate-500">Pick your Google account. No password, no waiting for emails.</p>
            <button
              onClick={continueWithGoogle}
              disabled={state.sending}
              className="focus-ring mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 text-[15px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:bg-white dark:text-slate-900"
            >
              <GoogleG className="h-5 w-5" />
              {state.sending ? 'Opening Google…' : 'Continue with Google'}
            </button>
            {state.error && <p className="mt-2 text-sm text-rose-600">{state.error}</p>}
            <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />or<span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /></div>
            <button onClick={() => { setUseEmail(true); setState({ sending: false, error: null }); }} className="focus-ring w-full rounded-xl py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-white/5">
              Use an email link instead
            </button>
            <p className="mt-4 text-center text-sm text-slate-500">
              {signIn ? <>New here? <a href="/connect/join" className="font-semibold text-brand-600 dark:text-brand-300">Join Connect</a></> : <>Already a member? <a href="/connect/join?mode=signin" className="font-semibold text-brand-600 dark:text-brand-300">Sign in</a></>}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              By continuing you agree to the <a href="/connect/guidelines" className="font-medium text-brand-600 underline dark:text-brand-300">community guidelines</a> and <a href="/privacy" className="font-medium text-brand-600 underline dark:text-brand-300">privacy policy</a>.
            </p>
          </div>
        )}

        {step === 'email' && (google === false || useEmail) && (
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
              By continuing you agree to the <a href="/connect/guidelines" className="font-medium text-brand-600 underline dark:text-brand-300">community guidelines</a> and <a href="/privacy" className="font-medium text-brand-600 underline dark:text-brand-300">privacy policy</a>.
            </p>
            {google && <button type="button" onClick={() => setUseEmail(false)} className="focus-ring mt-3 w-full text-center text-sm font-semibold text-brand-600 dark:text-brand-300">Back to Google sign-in</button>}
          </form>
        )}

        {step === 'sent' && (
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-helix-500/10 text-helix-600"><Icon name="sparkles" /></div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900 dark:text-white">Check your inbox</h1>
            <p className="mt-2 text-sm text-slate-500">We sent a sign-in link to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>. Open it on this device to continue.</p>
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
              <span className="font-semibold">Can’t find it?</span> Check your <span className="font-semibold">Spam</span> or <span className="font-semibold">Promotions</span> folder for an email from Spill the Genes, and mark it “Not spam” so future emails arrive in your inbox. It can take a couple of minutes.
            </p>
            <button onClick={() => setStep('email')} className="focus-ring mt-5 text-sm font-semibold text-brand-600 dark:text-brand-300">Use a different email</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Google's multicolour "G", as Google's sign-in branding guidelines ask for on this button.
function GoogleG({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
