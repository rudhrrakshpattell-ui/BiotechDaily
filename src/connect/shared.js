export const INTERESTS = [
  'Gene editing', 'mRNA', 'Cell therapy', 'Oncology', 'Neuroscience', 'Immunology', 'AI & drug discovery',
  'Synthetic biology', 'Bioinformatics', 'Genomics', 'Protein engineering', 'Microbiology', 'Bioprocessing',
  'Regulatory affairs', 'Biotech business', 'Lab research',
];

export const MIN_AGE = 13;
const AGE_BLOCK_KEY = 'bd-connect-age-block';

// Month + year only (no day): use the month's last day, i.e. the youngest the person could be.
export function birthDateFrom(year, month) {
  const last = new Date(Date.UTC(Number(year), Number(month), 0));
  return last.toISOString().slice(0, 10);
}

export function ageOn(birthDate, today = new Date()) {
  const b = new Date(`${birthDate}T00:00:00Z`);
  let age = today.getUTCFullYear() - b.getUTCFullYear();
  const m = today.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

// Once someone gives an under-13 age, don't let them simply go back and change it (COPPA guidance).
export const isAgeBlocked = () => { try { return Boolean(localStorage.getItem(AGE_BLOCK_KEY)); } catch { return false; } };
export const setAgeBlocked = () => { try { localStorage.setItem(AGE_BLOCK_KEY, new Date().toISOString()); } catch {} };

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// The birth date given at the Join step, kept in this browser until the profile exists. Supabase only
// stores sign-up metadata when it creates the account, so a repeat or earlier attempt can lose it.
const PENDING_BIRTH_KEY = 'bd-connect-birth-date';
export const savePendingBirthDate = (d) => { try { localStorage.setItem(PENDING_BIRTH_KEY, d); } catch {} };
export const pendingBirthDate = () => { try { return localStorage.getItem(PENDING_BIRTH_KEY); } catch { return null; } };
export const clearPendingBirthDate = () => { try { localStorage.removeItem(PENDING_BIRTH_KEY); } catch {} };
