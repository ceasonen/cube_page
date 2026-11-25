import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { renderArticle, renderSite } from '../src/render.mjs';

const data = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
const html = renderSite(data);

test('each section link has a rendered target and empty sections stay hidden', () => {
  const ids = Array.from(html.matchAll(/href="#([a-z-]+)"/g), match => match[1]);
  for (const id of ids) assert.match(html, new RegExp('id="' + id + '"'));
  assert.doesNotMatch(html, /id="(?:talks|reports)"/);
  const withTalk = renderSite({ ...data, talks: [{ title: 'Invited talk', date: '2026-11-24', url: 'https://example.com/talk' }] });
  assert.match(withTalk, /href="#talks"/);
  assert.match(withTalk, /id="talks"/);
});

test('accepted papers precede preprints and author roles render separately', () => {
  assert.ok(html.indexOf('ACM MM 2026') < html.indexOf('Preprint 2026'));
  assert.match(html, /Yi Xu<sup>\*‡<\/sup>, <strong>Cheng Chen<\/strong><sup>\*<\/sup>/u);
  assert.equal((html.match(/<article class="paper/g) || []).length, data.publications.length);
});

test('all project websites, CV links and the email action are present', () => {
  for (const item of [...data.projects, ...data.cvs]) assert.ok(html.includes(item.url), item.url);
  assert.ok(html.includes('href="mailto:' + data.email + '"'));
});

test('all local page assets exist under the public directory', async () => {
  const references = Array.from(html.matchAll(/(?:src|href)="(images\/[^"]+|(?:style|tone)\.css|tone\.js)"/g), match => match[1]);
  await Promise.all(references.map(path => access(new URL('../public/' + path, import.meta.url))));
});

test('writing links to a focused article with the shared theme control', () => {
  const post = data.writing[0];
  const article = renderArticle(data, post);
  assert.match(html, /href="writing\/acknowledgement\.html"/);
  assert.match(html, /<a href="#writing"><img[^>]+src="images\/writing\/usagi\.png"/);
  assert.match(article, /href="\.\.\/#writing"/);
  assert.match(article, /<h1>Acknowledgement<\/h1>/);
  assert.match(article, /<div class="reading-prose"><p>.*<a href="https:\/\//);
  for (const page of [html, article]) assert.match(page, /data-tone-input/);
  assert.throws(() => renderSite({ ...data, writing: [{ ...post, paragraphs: [] }] }), /Missing content/);
});

test('edited content is escaped and script URLs are rejected', () => {
  const sample = renderSite({ ...data, bio: ['<script>example</script>'] });
  assert.match(sample, /&lt;script&gt;example/);
  assert.throws(() => renderSite({ ...data, social: [{ label: 'unsafe', url: 'javascript:alert(1)' }] }), /Unsupported URL/);
});
