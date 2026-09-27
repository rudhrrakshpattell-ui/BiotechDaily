import { imageUrl } from '../../services/images.js';

const SIZES = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-20 w-20 text-2xl', xl: 'h-28 w-28 text-3xl' };
const PIXELS = { sm: 72, md: 96, lg: 160, xl: 256 };

export default function Avatar({ profile, size = 'md', className = '' }) {
  const initials = (profile?.display_name ?? '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (profile?.avatar_url) {
    return <img src={imageUrl(profile.avatar_url, PIXELS[size])} alt="" className={`shrink-0 rounded-full object-cover ${SIZES[size]} ${className}`} />;
  }
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-helix-500 font-display font-semibold text-white ${SIZES[size]} ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}
