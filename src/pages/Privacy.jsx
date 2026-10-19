import { PageHeader } from '../components/ui.jsx';

const CONTACT = 'biotechdailyconnect@gmail.com';
const UPDATED = 'October 19, 2026';

const SECTIONS = [
  ['Reading the news', [
    'You can read every story, company profile, funding round, video and podcast without an account. We don’t use advertising or analytics trackers.',
    'Your browser remembers a few settings on your device only, such as light or dark mode. Videos load from YouTube and podcast audio from each show’s host only when you press play, and those services have their own privacy policies.',
  ]],
  ['Joining The Gene Pool', [
    'When you join, we store your email address and your birth month and year. We use your age only to keep the community safe: you must be 13 or older to join, and members under 18 get extra messaging protections. Your birth date is never shown on your profile.',
    'If you sign in with Google, Google shares your name, email address and profile picture with us. We never see or store your Google password.',
    'Anything you add to your profile (name, username, university, program, interests, bio and photo), your posts, comments, likes, follows and direct messages are stored so the community works.',
  ]],
  ['Who can see what', [
    'Profiles and posts are visible to other members. Profiles of members under 18 are hidden from people who aren’t signed in. Direct messages are private between the people in the conversation, but a message that’s reported can be reviewed by the Spill the Genes team to keep members safe.',
  ]],
  ['Where your data lives', [
    'Account data is stored with Supabase, our database and sign-in provider. The site is hosted on Vercel. Sign-in emails are sent through Gmail. We don’t sell your data or share it with advertisers.',
  ]],
  ['Your choices', [
    'You can edit your profile at any time, and delete your account from Settings in The Gene Pool. Deleting your account removes your profile, posts, comments, likes, follows and messages.',
    `For anything else, including a copy of your data, email ${CONTACT}.`,
  ]],
  ['Changes', [
    'If this policy changes, we’ll update this page and the date at the top.',
  ]],
];

export default function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy policy" description={`How Spill the Genes and The Gene Pool handle your information. Last updated ${UPDATED}.`} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        {SECTIONS.map(([title, paragraphs]) => (
          <section key={title}>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
            {paragraphs.map((p) => <p key={p.slice(0, 24)} className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{p}</p>)}
          </section>
        ))}
        <p className="text-sm text-slate-500">
          Questions? Email <a href={`mailto:${CONTACT}`} className="font-semibold text-brand-600 dark:text-brand-300">{CONTACT}</a>.
        </p>
      </div>
    </>
  );
}
