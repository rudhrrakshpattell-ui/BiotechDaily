import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRound, parseRounds } from '../server/funding.js';

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
  ['Corsera raises $80M series B to take its weight-loss pill into phase 2', 'Pharma'],
  ['Verdiva Bio raises $411M series A for once-weekly oral obesity pills', 'Pharma'],
  ['Indian drugmaker Zenara secures $40M series B', 'Pharma'],
  ['AusperBio adds $120M series C to advance hep B oligo therapy through phase 3', 'Biotech'],
  ['BigHat Bio raises USD 75m Series C as AI-designed protein therapeutics advance', 'Biotech'],
];

for (const [title, want] of sectors) {
  test(`sector: ${title}`, () => {
    const r = parseRound({ title, summary: '', date: new Date().toISOString(), url: 'https://example.com', source: 'test' });
    assert.equal(r?.sector, want);
  });
}

// Pharma financing: rupee amounts, listings, share offerings and debt.
const pharma = [
  ['Mankind Pharma raises Rs 500 crore via QIP to fund expansion', 'Mankind Pharma|₹500 Cr|Other|Pharma'],
  ['Akums Drugs secures ₹1,200 crore loan for new injectables plant', 'Akums Drugs|₹1,200 Cr|Other|Pharma'],
  ['Corvane Pharma prices $300M public offering', 'Corvane Pharma|$300M|Other|Pharma'],
  ['Zenara Laboratories lands $40M series B for sterile injectables', 'Zenara Laboratories|$40M|Series B|Pharma'],
  ['GSK commits $800M to R&D, manufacturing hub, as Pennsylvania bonds deepen', null],
  ['Viatris to snap up Pacira’s non-opioid pain pipeline for $1.65B', null],
];

for (const [title, want] of pharma) {
  test(`pharma: ${title}`, () => {
    const r = parseRound({ title, summary: '', date: new Date().toISOString(), url: 'https://example.com', source: 'test' });
    assert.equal(r ? `${r.name}|${r.amountLabel}|${r.stage}|${r.sector}` : null, want);
  });
}

test('rupee amounts convert to USD millions', () => {
  const r = parseRound({ title: 'Mankind Pharma raises Rs 880 crore via QIP', summary: '', date: new Date().toISOString(), url: 'https://example.com', source: 'test' });
  assert.equal(r.amountM, 100);
  assert.equal(r.currency, 'INR');
});

// Roundup headlines (Endpoints News) carry more than one round.
const roundups = [
  ['City Therapeutics targets $158M IPO; Iambic seeks $135M Nasdaq debut', ['City Therapeutics|$158M|IPO', 'Iambic|$135M|Other']],
  ['TRexBio prices $117M IPO for Tregs as Retension lands $45M Nasdaq debut for hypertension', ['TRexBio|$117M|IPO', 'Retension|$45M|Other']],
  ['Robotics company Multiply Labs nets $75M; Isotope maker NorthStar gets up to $185M', ['Multiply Labs|$75M|Other']],
];

for (const [title, want] of roundups) {
  test(`roundup: ${title}`, () => {
    const rs = parseRounds({ title, summary: '', date: new Date().toISOString(), url: 'https://example.com', source: 'test' });
    assert.deepEqual(rs.map((r) => `${r.name}|${r.amountLabel}|${r.stage}`), want);
    assert.ok(rs.every((r) => r.headline === title));
  });
}
