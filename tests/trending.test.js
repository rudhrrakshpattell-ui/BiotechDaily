import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTrending, trendByKey } from '../src/services/trending.js';
import { queryNews } from '../src/services/queries.js';

const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();
const story = (title, h = 1) => ({ title, summary: '', date: hoursAgo(h) });

// Enough filler that the 72h window is used (the widening kicks in under 30 documents).
const filler = Array.from({ length: 30 }, (_, i) => story(`Unrelated research update ${i}`));

test('ranks companies and themes by number of stories in the window', () => {
  const news = [
    ...filler,
    story('Eli Lilly wins FDA approval for weekly insulin'),
    story('Lilly and Novo battle over obesity market'),
    story('Novo Nordisk cuts jobs'),
    story('Lilly old story', 200), // outside 72h
  ];
  const t = computeTrending({ news });
  assert.equal(t.windowHours, 72);
  assert.deepEqual(t.companies.map((c) => [c.name, c.count]), [['Eli Lilly', 2], ['Novo Nordisk', 2]]);
  assert.ok(!t.themes.some((x) => x.label === 'FDA decisions'), 'a single FDA mention is below the threshold');
});

test('case-sensitive names avoid common-word false positives', () => {
  const news = [...filler, story('A vertex in the graph'), story('the csl plant'), story('Vertex gets approval'), story('Vertex expands')];
  const vertex = computeTrending({ news }).companies.find((c) => c.name === 'Vertex');
  assert.equal(vertex?.count, 2);
});

test('/news?trend= filters with the same rule the counts use', () => {
  const news = [...filler, story('Eli Lilly wins approval'), story('Lilly expands'), story('Pfizer update')];
  const result = queryNews(news, { trend: 'eli-lilly', pageSize: 50 });
  assert.equal(result.total, 2);
  assert.ok(trendByKey['obesity-drugs'] && trendByKey['m-and-a'] && trendByKey['alzheimers']);
  assert.equal(queryNews(news, { trend: 'no-such-trend' }).total, 0);
});
