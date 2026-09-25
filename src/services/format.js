export function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.round(diff / 86400)}d ago`;
  return formatDate(iso);
}

export const formatDate = (iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-US', opts);

export const formatMoney = (millions) =>
  millions >= 1000 ? `$${(millions / 1000).toFixed(1)}B` : `$${millions}M`;

export const formatNumber = (n) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
