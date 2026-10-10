// Funding rounds extracted from live biotech and pharma news headlines ("Enveda reaps $311M series E ...").
// Only covers rounds the news feeds report, i.e. roughly the last 1-2 weeks.
import { getLiveNews } from './news.js';
import { classify, hash } from './rss.js';
import { categoryById } from '../src/data/categories.js';

// Verbs that on their own signal a company raising money.
const RAISE_VERBS = 'raises|raised|raise|scores|reaps|amasses|rakes in|hauls in|hauls|bags|nabs|snags|secures|lands|closes|nets|banks|pulls in|collects';
// Verbs that only count when a financing word is also present ("adds $120M series C").
const WEAK_VERBS = 'adds|gets|launches with|debuts with|emerges with|rises with|unveils|announces|completes|prices|files for|targets|seeks|eyes|plans';
const VERB_RE = new RegExp(`\\s(${RAISE_VERBS}|${WEAK_VERBS})\\b`, 'i');
const STRONG_RE = new RegExp(`^(${RAISE_VERBS})$`, 'i');
// Pharma companies also raise through listings, share offerings and debt ("prices $300M public offering", "Rs 500 crore QIP").
const FINANCING_RE = /\b(series [a-h]|seed|pre-seed|ipo|financing|funding|round|venture|private placement|(?:public|share|stock|notes?) offering|nasdaq debut|listing|qip|rights issue|convertible notes?|debt|loan|credit facility)\b/i;
// Headlines with money in them that are about something other than a company raising capital.
const EXCLUDE_RE = /\b(deal|pact|acqui\w*|buyout|merger|licens\w*|partnership|collaboration|contract|settle\w*|lawsuit|layoffs?|prospect|market to|fund (?:launch|close)|vc firm)\b/i;
const NOT_A_NAME = /\b(ceo|founder|former|executive|biotechs|pharmas|drugmakers|startups|investors)\b/i;

const FX_TO_USD = { $: 1, US$: 1, USD: 1, '€': 1.1, EUR: 1.1, '£': 1.3, GBP: 1.3, CHF: 1.1 };
const INR_TO_USD = 1 / 88;

// Indian pharma rounds are reported in rupees: "Rs 500 crore", "₹1,200 crore", "INR 80 crore". 1 crore = 10M rupees.
function parseRupees(title) {
  const m = title.match(/(?:rs\.?|₹|inr)\s?(\d[\d,]*(?:\.\d+)?)\s?(crore|cr|lakh)\b/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  const crore = /^l/i.test(m[2]) ? n / 100 : n;
  return { amountM: Math.round(crore * 10 * INR_TO_USD * 10) / 10, amountLabel: `₹${(+crore.toFixed(2)).toLocaleString('en-IN')} Cr`, currency: 'INR' };
}

function parseAmount(title) {
  const rupees = parseRupees(title);
  if (rupees) return rupees;
  const m =
    title.match(/(US\$|USD|\$|€|EUR|£|GBP|CHF)\s?(\d+(?:[.,]\d+)?)\s?(billion|bn|b|million|mn|m)?\b/i) ??
    title.match(/(\d+(?:\.\d+)?)\s?(million|m|billion|bn)\s?(euros?|dollars?|pounds?)/i);
  if (!m) return null;
  let symbol, value, unit;
  if (/^\d/.test(m[1])) {
    [value, unit] = [m[1], m[2]];
    symbol = /euro/i.test(m[3]) ? '€' : /pound/i.test(m[3]) ? '£' : '$';
  } else {
    [symbol, value, unit] = [m[1].toUpperCase() === 'US$' ? 'US$' : m[1], m[2], m[3] ?? 'm'];
  }
  const n = Number(value.replace(',', '.'));
  const millions = /^b/i.test(unit) ? n * 1000 : n;
  if (!Number.isFinite(millions) || millions <= 0) return null;
  const rate = FX_TO_USD[symbol] ?? FX_TO_USD[symbol.toUpperCase()] ?? 1;
  const shown = millions >= 1000 ? `${+(millions / 1000).toFixed(2)}B` : `${+millions.toFixed(2)}M`;
  return { amountM: Math.round(millions * rate * 10) / 10, amountLabel: `${symbol === 'US$' || symbol === 'USD' ? '$' : symbol}${shown}`, currency: rate === 1 ? 'USD' : symbol };
}

function parseStage(text) {
  const m = text.match(/\b(pre-seed|seed|series ([a-h])|ipo)\b/i);
  if (!m) return 'Other';
  if (/^pre-seed|^seed/i.test(m[1])) return 'Seed';
  if (/^ipo/i.test(m[1])) return 'IPO';
  const letter = m[2].toUpperCase();
  return letter <= 'C' ? `Series ${letter}` : 'Series D+';
}

// Company = the run of capitalized words right before the verb: "RNAi drug specialist ADARx raises" -> "ADARx".
function parseCompany(beforeVerb) {
  const tokens = beforeVerb.replace(/[’']s$/, '').split(/\s+/);
  const name = [];
  for (let i = tokens.length - 1; i >= 0 && name.length < 5; i--) {
    const t = tokens[i].replace(/[,:;“”"]/g, '');
    if (!/^[A-Z0-9]/.test(t)) break;
    name.unshift(t);
  }
  const result = name.join(' ');
  return result.length >= 2 && !NOT_A_NAME.test(result) ? result : null;
}

// Therapeutic/technology areas for startups, checked before the broader news topics.
const AREA_RULES = [
  ['Gene Editing', /\b(crispr|gene[- ]edit|base edit|prime edit|epigenetic edit)/i],
  ['Gene Therapy', /\bgene therap/i],
  ['RNA Therapeutics', /\b(rnai|sirna|mrna|oligo\w*|antisense|rna[- ](?:drug|focused|medicine|therap|biotech|editing))/i],
  ['Cell Therapy', /\b(car-?t|cell therap|nk cell|t[- ]cell)/i],
  ['AI Drug Discovery', /\b(ai\b|artificial intelligence|machine learning|computational)/i],
  ['Oncology', /\b(cancer|tumou?r|oncolog|leukemia|lymphoma|myeloma|carcinoma)/i],
  ['Neuroscience', /\b(alzheimer|parkinson|als\b|neuro|brain|dementia|psychiatr)/i],
  ['Immunology', /\b(autoimmun|immunolog|inflammat|lupus|arthritis|dermatitis|psoriasis)/i],
  ['Metabolic Disease', /\b(obesity|diabetes|metabolic|weight loss|cardiometabolic|liver disease|mash\b)/i],
  ['Ophthalmology', /\b(eye|retina|ophthalm|vision|thyroid eye)/i],
  ['Infectious Disease', /\b(antibiotic|antiviral|infect|vaccine|virus|bacteria)/i],
  ['Rare Disease', /\b(rare disease|orphan|genetic disease)/i],
  ['Drug Discovery', /\b(drug discovery|platform)/i],
];

// Pharma vs biotech for the sector filter: pharma when the story is about classic drug-making
// (small molecules, oral drugs, formulation, delivery, generics, manufacturing) or the company calls itself
// a pharma or drugmaker.
const PHARMA_RE = /\b(pharma\w*|drug[- ]?makers?|medicines? makers?|laborator(?:y|ies)|active pharmaceutical ingredients?|small[- ]molecules?|oral (?:drugs?|pills?|tablets?|therap\w*|medicines?)|pills?|tablets?|generics?|biosimilars?|formulations?|drug delivery|injectables?|api manufactur\w*|cdmo|contract manufactur\w*|specialty drugs?)\b/i;
export const sectorOf = (text) => (PHARMA_RE.test(text) ? 'Pharma' : 'Biotech');

const INVESTORS_RE = /\bled by ([A-Z][\w&.'’\- ]+?)(?:,| with | and (?:joined|participation)|\.|;|$)/;

// Roundup headlines report several rounds at once: "City Therapeutics targets $158M IPO; Iambic seeks $135M Nasdaq debut",
// "TRexBio prices $117M IPO as Retension lands $45M Nasdaq debut". Each clause is parsed on its own.
const splitClauses = (title) => title.split(/;\s+|\s+as\s+(?=[A-Z])/);

export function parseRounds(story) {
  const clauses = splitClauses(story.title);
  const rounds = clauses.map((title) => parseClause(title, story)).filter(Boolean);
  return rounds.map((r) => ({ ...r, headline: story.title }));
}

export const parseRound = (story) => parseRounds(story)[0] ?? null;

function parseClause(title, story) {
  if (EXCLUDE_RE.test(title)) return null;
  const verb = title.match(VERB_RE);
  if (!verb) return null;
  if (!STRONG_RE.test(verb[1]) && !FINANCING_RE.test(title)) return null;
  const amount = parseAmount(title.slice(verb.index));
  if (!amount) return null;
  const name = parseCompany(title.slice(0, verb.index));
  if (!name) return null;

  // Strip money words first, otherwise nearly every round classifies as "funding".
  const noMoney = (t = '') => t.replace(/\b(rais\w*|fund\w*|financ\w*|series [a-h]|seed|ipo|venture|invest\w*|round|capital|backers?|deals?)\b/gi, ' ');
  const hay = `${noMoney(title)} ${noMoney(story.summary)}`;
  const topic = classify(noMoney(title), noMoney(story.summary));
  const area =
    AREA_RULES.find(([, re]) => re.test(hay))?.[0] ??
    (['funding', 'industry', 'regulatory', 'research'].includes(topic) ? 'Biotech' : categoryById[topic]?.label ?? 'Biotech');
  const investors = story.summary?.match(INVESTORS_RE)?.[1]?.trim();

  return {
    id: `round-${hash(name.toLowerCase())}`,
    name,
    sector: sectorOf(`${title} ${story.summary ?? ''}`),
    stage: parseStage(`${title} ${story.summary ?? ''}`),
    area,
    ...amount,
    date: story.date,
    headline: title,
    url: story.url,
    source: story.source,
    investors: investors ? [investors] : [],
  };
}

export async function getFundingRounds() {
  const { items, fetchedAt } = await getLiveNews();
  const byCompany = new Map();
  // Oldest first, so the earliest report of a round is kept and later coverage only fills gaps.
  for (const story of [...items].reverse()) {
    for (const round of parseRounds(story)) {
      const prev = byCompany.get(round.id);
      if (!prev) byCompany.set(round.id, { ...round, sources: [round.source] });
      else {
        if (prev.stage === 'Other' && round.stage !== 'Other') prev.stage = round.stage;
        if (!prev.investors.length) prev.investors = round.investors;
        if (!prev.sources.includes(round.source)) prev.sources.push(round.source);
      }
    }
  }
  return { items: [...byCompany.values()], fetchedAt };
}
