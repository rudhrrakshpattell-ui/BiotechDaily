import { imageUrl } from '../../services/images.js';
import { defaultDnaAvatar, dnaAvatarId, dnaAvatarSrc } from '../dnaAvatars.js';

const SIZES = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-20 w-20 text-2xl', xl: 'h-28 w-28 text-3xl' };
const PIXELS = { sm: 72, md: 96, lg: 160, xl: 256 };

// An uploaded photo, a chosen DNA style, or (no picture yet) a DNA style derived from the member's id.
export default function Avatar({ profile, size = 'md', className = '' }) {
  const url = profile?.avatar_url;
  const dna = dnaAvatarId(url) ?? (!url && profile?.id ? defaultDnaAvatar(profile.id) : null);
  if (dna) {
    return <img src={dnaAvatarSrc(dna)} alt="" className={`shrink-0 rounded-full object-cover ${SIZES[size]} ${className}`} />;
  }
  if (url) {
    return <img src={imageUrl(url, PIXELS[size])} alt="" className={`shrink-0 rounded-full object-cover ${SIZES[size]} ${className}`} />;
  }
  const initials = (profile?.display_name ?? '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-helix-500 font-display font-semibold text-white ${SIZES[size]} ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}
