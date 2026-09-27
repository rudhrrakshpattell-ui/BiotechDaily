import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { supabase, friendlyError } from '../supabase.js';
import { MIN_AGE, ageOn, birthDateFrom, isAgeBlocked, setAgeBlocked } from '../shared.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => thisYear - i);

// mode 'signin': returning members skip the age step, and no new account can be created that way.
export default function Join({ mode }) {
  const signIn = mode === 'signin';
  const [step, setStep] = useState(isAgeBlocked() && !signIn ? 'blocked' : signIn ? 'email' : 'age');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ sending: false, error: null });
  const birthDate = month && year ? birthDateFrom(year, month) : null;

  function confirmAge(e) {
    e.preventDefault();
    if (ageOn(birthDate) < MIN_AGE) {
      setAgeBlocked();
      setStep('blocked');
    } else {
      setStep('email');
    }
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
              BiotechDaily Connect is for students aged {MIN_AGE} and over. You can still read all the news, videos and podcasts on BiotechDaily.
            </p>
            <a href="/" className="focus-ring mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Go to BiotechDaily</a>
          </div>
        )}

        {step === 'age' && (
          <form onSubmit={confirmAge}>
            <p className="eyebrow mb-2">Join Connect</p>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">When were you born?</h1>
            <p className="mt-2 text-sm text-slate-500">We ask so we can keep younger members safe. Your birth date is never shown on your profile.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">Month</span>
                <select value={month} onChange={(e) => setMonth(e.target.value)} required className="input">
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">Year</span>
                <select value={year} onChange={(e) => setYear(e.target.value)} required className="input">
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </div>
            <button disabled={!birthDate} className="focus-ring mt-6 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Continue</button>
            <p className="mt-4 text-center text-sm text-slate-500">Already a member? <a href="/connect/join?mode=signin" className="font-semibold text-brand-600 dark:text-brand-300">Sign in</a></p>
          </form>
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
            <button onClick={() => setStep('email')} className="focus-ring mt-5 text-sm font-semibold text-brand-600 dark:text-brand-300">Use a different email</button>
          </div>
        )}
      </div>
    </div>
  );
}
