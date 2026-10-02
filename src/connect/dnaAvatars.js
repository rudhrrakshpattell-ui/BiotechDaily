import { DEFAULT_SITE_URL } from '../seo.js';

// DNA profile pictures, served as static SVGs from public/avatars/. A member's choice is saved in
// profiles.avatar_url as an absolute https URL (the column only accepts https), and recognized by its path
// so it renders from this site in every environment.
export const DNA_AVATARS = [
  { id: 'classic', label: 'Classic' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'mint', label: 'Mint' },
  { id: 'sunrise', label: 'Sunrise' },
  { id: 'neon', label: 'Neon' },
  { id: 'bases', label: 'Base pairs' },
  { id: 'plasmid', label: 'Plasmid' },
  { id: 'mono', label: 'Mono' },
];

const IDS = new Set(DNA_AVATARS.map((a) => a.id));

export const dnaAvatarSrc = (id) => `/avatars/dna-${id}.svg`;
export const dnaAvatarUrl = (id) => `${DEFAULT_SITE_URL}${dnaAvatarSrc(id)}`;

// The DNA style an avatar_url points at, or null for an uploaded photo / no avatar.
export function dnaAvatarId(url) {
  const id = url?.match(/\/avatars\/dna-([a-z]+)\.svg$/)?.[1];
  return id && IDS.has(id) ? id : null;
}

// Members without a picture get a stable DNA style picked from their id.
export function defaultDnaAvatar(seed = '') {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DNA_AVATARS[h % DNA_AVATARS.length].id;
}
