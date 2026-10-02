import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRound } from '../server/funding.js';

// [headline, expected "name|amount|stage"] — null means it must NOT be read as a funding round.
const cases = [
  ['AusperBio adds $120M series C to advance hep B oligo therapy through phase 3', 'AusperBio|$120M|Series C'],
  ['Kasvu Therapeutics raises 30M euros in Series A financing round', 'Kasvu Therapeutics|€30M|Series A'],
  ['Basecamp Research Raise $140M Series C Financing Toward Advancing AI-Designed Drugs', 'Basecamp Research|$140M|Series C'],
  ['TwoStep Therapeutics Announces Oversubscribed $62.5 Million Series A Financing', 'TwoStep Therapeutics|$62.5M|Series A'],
  ['AQ Biotech raises €2.5M seed to scale urine cancer test', 'AQ Biotech|€2.5M|Seed'],
  ['Solstice rises with $225M series A to advance next-gen CTLA-4 immunotherapy', 'Solstice|$225M|Series A'],
  ['Dementia biotech Kinoxis raises $6.75 million with a $2.5m grant', 'Kinoxis|$6.75M|Other'],
  ['BigHat Bio raises USD 75m Series C as AI-designed protein therapeutics advance', 'BigHat Bio|$75M|Series C'],
  ['Novo inks $1.3B Nanexa deal to unlock long-acting obesity injectables', null],
  ['Former Mural Oncology CEO launches new cancer biotech with $225M in venture capital', null],
  ['Trump’s Department of War bets $47M on Flagship biotechs', null],
  ['Lexeo takes up the Mantle in $8M acquisition for Friedreich ataxia assets', null],
  ['Growth mode: 3 biotechs that are staffing up after series B raises', null],
  ['Merck sees pivotal victory for $3B eye disease prospect', null],
];

for (const [title, want] of cases) {
  test(title, () => {
    const r = parseRound({ title, summary: '', date: new Date().toISOString(), url: 'https://example.com', source: 'test' });
    assert.equal(r ? `${r.name}|${r.amountLabel}|${r.stage}` : null, want);
  });
}

// [headline, expected sector] for the Startups sector filter.
const sectors = [
  ['Corvane Pharma raises $120M series B for oral degraders', 'Pharma'],
  ['Dosera adds $45M series A to build long-acting injectables', 'Pharma'],
  ['Kinetix lands $11M seed for small-molecule kinase inhibitors', 'Pharma'],
  ['AusperBio adds $120M series C to advance hep B oligo therapy through phase 3', 'Biotech'],
  ['BigHat Bio raises USD 75m Series C as AI-designed protein therapeutics advance', 'Biotech'],
];

for (const [title, want] of sectors) {
  test(`sector: ${title}`, () => {
    const r = parseRound({ title, summary: '', date: new Date().toISOString(), url: 'https://example.com', source: 'test' });
    assert.equal(r?.sector, want);
  });
}
