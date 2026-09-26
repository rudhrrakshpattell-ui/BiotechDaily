import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixAllCaps } from '../server/pressReleases.js';

test('all-caps titles become title case, keeping acronyms and codes', () => {
  assert.equal(
    fixAllCaps('AMGEN ANNOUNCES POSITIVE TOPLINE PHASE 3 RESULTS FOR DAZODALIBEP IN MODERATE-TO-SEVERE THYROID EYE DISEASE'),
    'Amgen Announces Positive Topline Phase 3 Results for Dazodalibep in Moderate-to-Severe Thyroid Eye Disease',
  );
  assert.equal(fixAllCaps('FDA APPROVES REDUCED MONITORING TIME FOR FIRST TWO DOSES OF IMDELLTRA®'), 'FDA Approves Reduced Monitoring Time for First Two Doses of Imdelltra®');
  assert.equal(fixAllCaps("AMGEN'S REPATHA® REDUCES LDL-C IN Q3"), "Amgen's Repatha® Reduces LDL-C in Q3");
});

test('normally cased titles are left alone', () => {
  const t = 'Vertex Announces Positive Results From Phase 2b AMPLIFIED Study';
  assert.equal(fixAllCaps(t), t);
});
