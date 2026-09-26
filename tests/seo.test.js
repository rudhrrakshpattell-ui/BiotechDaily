import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metaFor, SITEMAP_PATHS } from '../src/seo.js';
import { seoTags } from '../api/page.js';

test('known pages are indexable with their own titles', () => {
  assert.equal(metaFor('/').status, 200);
  assert.match(metaFor('/companies/vertex').title, /^Vertex: company profile/);
  assert.equal(metaFor('/news', { category: 'oncology' }).title, 'Oncology news | BiotechDaily');
  for (const path of SITEMAP_PATHS) assert.equal(metaFor(path).index, true, path);
});

test('unknown pages are 404 and not indexed', () => {
  for (const path of ['/nope', '/companies/nope', '/news/extra', '/companies/vertex/extra']) {
    const meta = metaFor(path);
    assert.equal(meta.status, 404, path);
    assert.equal(meta.index, false, path);
  }
});

test('search result URLs are not indexed', () => {
  assert.equal(metaFor('/news', { q: 'crispr' }).index, false);
  assert.equal(metaFor('/startups', { q: 'adarx' }).index, false);
});

test('tags are escaped and previews get noindex', () => {
  const { html } = seoTags('/companies/vertex', {}, 'https://example.com');
  assert.match(html, /<link rel="canonical" href="https:\/\/example.com\/companies\/vertex" \/>/);
  assert.match(html, /pipeline &amp; news/);
  assert.doesNotMatch(html, /noindex/);
  assert.match(seoTags('/', {}, 'https://example.com', { production: false }).html, /noindex/);
});

test('index.html defaults match the home page meta and credit the founder', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const home = metaFor('/');
  assert.equal(html.split(`content="${home.description}"`).length - 1, 3, 'description, og:description, twitter:description');
  assert.match(html, /<meta name="author" content="Rudhrraksh Pattell" \/>/);
});
