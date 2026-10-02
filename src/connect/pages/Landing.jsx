import Icon from '../../components/Icon.jsx';
import PostList from '../components/PostList.jsx';

const FEATURES = [
  ['users', 'Find your people', 'Follow biotech students from universities around the world.'],
  ['sparkles', 'Share what you’re working on', 'Papers, lab wins, internship tips, questions.'],
  ['flask', 'Built for science students', 'Profiles show your program, university and research interests.'],
];

export default function Landing() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/70 dark:border-white/5">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-helix-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
          <p className="eyebrow mb-3">BiotechDaily Connect</p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            The community for <span className="bg-gradient-to-r from-brand-600 to-helix-500 bg-clip-text text-transparent dark:from-brand-300 dark:to-helix-400">biotech students.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">Create your profile, follow other students, and share what you’re learning and building.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/connect/join" className="focus-ring rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">Join free</a>
            <a href="/connect/join?mode=signin" className="focus-ring rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300 dark:border-white/10 dark:bg-ink-900 dark:text-slate-200">Sign in</a>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {FEATURES.map(([icon, title, text]) => (
              <div key={title} className="card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"><Icon name={icon} /></span>
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h2 className="mb-4 font-display text-xl font-semibold text-slate-900 dark:text-white">Recent posts from the community</h2>
        <PostList
          feed="discover"
          me={null}
          empty={<p className="card p-6 text-center text-sm text-slate-500">No public posts yet. <a href="/connect/join" className="font-semibold text-brand-600">Be the first</a>.</p>}
        />
        <p className="mt-6 text-center text-sm text-slate-500"><a href="/connect/join" className="font-semibold text-brand-600 dark:text-brand-300">Join</a> to see everything, follow students and post.</p>
      </section>
    </>
  );
}
