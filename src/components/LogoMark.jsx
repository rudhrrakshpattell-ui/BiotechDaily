// The BiotechDaily mark: a hand-drawn blue and green DNA double helix (public/logo.png, 192px with a
// transparent background; source artwork in design/logo-source.png).
export default function LogoMark({ className = 'h-9 w-9' }) {
  return <img src="/logo.png" alt="" width="36" height="36" decoding="async" className={`select-none object-contain ${className}`} draggable="false" />;
}
