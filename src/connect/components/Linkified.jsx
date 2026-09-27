// Renders post text with URLs turned into links (nofollow/ugc, opened in a new tab).
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/g;

export default function Linkified({ text }) {
  return text.split(URL_RE).map((part, i) =>
    i % 2 ? (
      <a key={i} href={part} target="_blank" rel="nofollow ugc noopener noreferrer" className="break-all font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700 dark:text-brand-300">
        {part.replace(/^https?:\/\//, '')}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
