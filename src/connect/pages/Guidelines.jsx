const RULES = [
  ['Be kind and respectful', 'Disagree with ideas, not people. No harassment, bullying, hate speech or threats.'],
  ['Keep it about science and studies', 'Share research, lab and study tips, career questions and biotech news. No spam or self-promotion schemes.'],
  ['Protect privacy', 'Never post anyone’s personal information: addresses, phone numbers, school schedules or private messages. Don’t share where you are in real time.'],
  ['No medical advice', 'Discuss science freely, but don’t tell people how to treat their own health conditions. Point them to a doctor.'],
  ['Be honest', 'Don’t impersonate others or misrepresent research. Cite sources when you can.'],
  ['Nothing explicit or dangerous', 'No sexual content, graphic violence, or instructions that could cause harm, including misuse of biological agents.'],
];

export default function Guidelines() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="eyebrow mb-2">BiotechDaily Connect</p>
      <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Community guidelines</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Connect is a place for students aged 13 and over to learn about biotech together. These rules keep it safe and useful for everyone.</p>
      <ol className="mt-8 space-y-4">
        {RULES.map(([title, text], i) => (
          <li key={title} className="card flex gap-4 p-5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 font-display text-sm font-semibold text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">{i + 1}</span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="card mt-8 space-y-3 p-5 text-sm text-slate-600 dark:text-slate-400">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Safety features</h2>
        <p><span className="font-semibold text-slate-800 dark:text-slate-200">Members under 18</span> have profiles and posts that are visible only to signed-in members, never to the public web or search engines.</p>
        <p><span className="font-semibold text-slate-800 dark:text-slate-200">Direct messages</span> are only possible between members who follow each other. If either of you unfollows or blocks, new messages stop. Messages are private, but a message that’s reported can be reviewed by BiotechDaily.</p>
        <p><span className="font-semibold text-slate-800 dark:text-slate-200">Report and block:</span> use the ••• menu on any post or profile. Blocking hides you from each other completely.</p>
        <p><span className="font-semibold text-slate-800 dark:text-slate-200">Your data:</span> we store your email, birth month and year (never shown), what you put on your profile, and your posts, comments and messages. You can delete your account and everything in it at any time from Settings.</p>
        <p>Breaking these rules can lead to posts being removed or accounts being suspended.</p>
      </section>
    </div>
  );
}
