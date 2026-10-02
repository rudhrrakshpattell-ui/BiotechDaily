// Routes remote images through Vercel Image Optimization (/_vercel/image) in production, so a 3000px
// podcast cover or 1024px news photo is resized, converted to AVIF/WebP and served from our own domain
// (which also avoids the image hosts' third-party cookies).
//
// Keep OPTIMIZED_HOSTS in sync with "images.remotePatterns" in vercel.json: Vercel rejects hosts that
// aren't listed there, so anything else is returned unchanged.
const OPTIMIZED_HOSTS = [
  /(^|\.)statnews\.com$/,
  /(^|\.)fiercebiotech\.com$/,
  /(^|\.)fiercepharma\.com$/,
  /(^|\.)endpts\.com$/,
  /(^|\.)pharmaceutical-technology\.com$/,
  /(^|\.)genengnews\.com$/,
  /(^|\.)labiotech\.eu$/,
  /(^|\.)biospace\.com$/,
  /^imgproxy\.divecdn\.com$/,
  /^megaphone\.imgix\.net$/,
  /^d3t3ozftmdmh3i\.cloudfront\.net$/,
  /(^|\.)sndcdn\.com$/,
  /^hosting-media\.riverside\.com$/,
  /^storage\.buzzsprout\.com$/,
  /\.supabase\.co$/, // Connect profile photos and post images
];

// Must match "images.sizes" in vercel.json.
const SIZES = [64, 128, 256, 384, 640, 828, 1200];

const enabled = Boolean(import.meta.env?.PROD);

function optimizable(url) {
  if (!enabled || !url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && OPTIMIZED_HOSTS.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}

const nearestSize = (w) => SIZES.find((s) => s >= w) ?? SIZES.at(-1);

export function imageUrl(url, width, quality = 75) {
  if (!optimizable(url)) return url;
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${nearestSize(width)}&q=${quality}`;
}

// Props for a responsive <img>: pass the widths it's shown at and a matching `sizes` string.
export function imageProps(url, widths, sizes) {
  if (!optimizable(url)) return { src: url };
  const unique = [...new Set(widths.map(nearestSize))];
  return {
    src: imageUrl(url, unique.at(-1)),
    srcSet: unique.map((w) => `${imageUrl(url, w)} ${w}w`).join(', '),
    sizes,
  };
}
