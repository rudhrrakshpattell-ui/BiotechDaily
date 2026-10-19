// Funding rounds extracted from live news headlines ("Enveda reaps $311M series E ...").
// Only covers rounds the news feeds report, i.e. roughly the last 1-2 weeks.
import { getLiveNews } from './news.js';
import { classify, hash } from './rss.js';
import { categoryById } from '../src/data/categories.js';

// Verbs that on their own signal a company raising money.
const RAISE_VERBS = 'raises|raised|raise|scores|reaps|amasses|rakes in|hauls in|hauls|bags|nabs|snags|secures|lands|closes|nets|banks|pulls in|collects';
// Verbs that only count when a financing word is also present ("adds $120M series C").
const WEAK_VERBS = 'adds|gets|launches with|debuts with|emerges with|rises with|unveils|announces|completes|prices|files for';
const VERB_RE = new RegExp(`\\s(${RAISE_VERBS}|${WEAK_VERBS})\\b`, 'i');
const STRONG_RE = new RegExp(`^(${RAISE_VERBS})$`, 'i');
const FINANCING_RE = /\b(series [a-h]|seed|pre-seed|ipo|financing|funding|round|venture|private placement)\b/i;
// Headlines with money in them that are about something other than a company raising capital.
const EXCLUDE_RE = /\b(deal|pact|acqui\w*|buyout|merger|licens\w*|partnership|collaboration|contract|settle\w*|lawsuit|layoffs?|prospect|market to|fund (?:launch|close)|vc firm|new [\w ]{0,24}funds?|largest fundraise|to (?:back|invest in) [\w ]{0,30}(?:players|companies|startups|biotechs))\b/i;
const NOT_A_NAME = /\b(ceo|founder|former|executive|biotechs|startups|investors)\b/i;

const FX_TO_USD = { $: 1, US$: 1, USD: 1, '€': 1.1, EUR: 1.1, '£': 1.3, GBP: 1.3, CHF: 1.1 };

function parseAmount(title) {
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
  // "Biogen-backed Estuary" -> "Estuary".
  const tokens = beforeVerb.replace(/[’']s$/, '').split(/\s+/).filter((w) => !/-backed$/i.test(w));
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
const PHARMA_RE = /\b(pharma\w*|drugmakers?|small[- ]molecules?|oral (?:drugs?|pills?|tablets?|therap\w*|medicines?)|pills?|tablets?|generics?|biosimilars?|formulations?|drug delivery|long-acting injectables?|api manufactur\w*|cdmo|specialty drugs?)\b/i;
export const sectorOf = (text) => (PHARMA_RE.test(text) ? 'Pharma' : 'Biotech');

const INVESTORS_RE = /\bled by ([A-Z][\w&.'’\- ]+?)(?:,| with | and (?:joined|participation)|\.|;|$)/;

export function parseRound(story) {
  const title = story.title;
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

// Words that don't identify a company: "City Therapeutics" and "City" are the same startup.
const NAME_SUFFIX = /\b(therapeutics|therapeutic|bio|biotech|biosciences?|biotherapeutics|pharma\w*|medicines?|inc|ltd|labs?|health|sciences?)\b/gi;
const coreName = (name) => name.toLowerCase().replace(NAME_SUFFIX, ' ').replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/)[0] ?? '';

// Two reports of one round: the same core company name and amounts within 20% (outlets round differently,
// or count committed versus closed money).
export function sameRound(a, b) {
  if (a.currency !== b.currency || !coreName(a.name) || coreName(a.name) !== coreName(b.name)) return false;
  return Math.abs(a.amountM - b.amountM) <= 0.2 * Math.max(a.amountM, b.amountM);
}

// Folds repeat coverage of a round into its earliest report. Expects rounds oldest first.
export function mergeRounds(rounds) {
  const merged = [];
  for (const round of rounds) {
    const prev = merged.find((m) => m.id === round.id || sameRound(m, round));
    if (!prev) {
      merged.push({ ...round, sources: [round.source] });
      continue;
    }
    if (round.name.length > prev.name.length) prev.name = round.name; // "City Therapeutics" over "City"
    if (prev.stage === 'Other' && round.stage !== 'Other') prev.stage = round.stage;
    if (!prev.investors.length) prev.investors = round.investors;
    if (!prev.sources.includes(round.source)) prev.sources.push(round.source);
  }
  return merged;
}

export async function getFundingRounds() {
  const { items, fetchedAt } = await getLiveNews();
  // Oldest first, so the earliest report of a round is kept and later coverage only fills gaps.
  const rounds = [...items].reverse().map(parseRound).filter(Boolean);
  return { items: mergeRounds(rounds), fetchedAt };
}
