import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import { renderArticle, renderSite, renderWritingIndex } from '../src/render.mjs';

const data = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
const html = renderSite(data);

test('each navigation link has a target and event sections have no sample entries', () => {
  const ids = Array.from(html.matchAll(/href="#([a-z-]+)"/g), match => match[1]);
  for (const id of ids) assert.match(html, new RegExp('id="' + id + '"'));
  for (const section of ['Talks', 'Reports']) {
    assert.match(html, new RegExp(`href="#${section.toLowerCase()}">${section}`));
    assert.match(html, new RegExp(`>${section}</h2>\\s*<div class="chapter-body"></div>`));
  }
  assert.match(html, /href="writing\/" class="writing-nav-link"/);
  assert.match(html, /id="writing-title">Writing<img[^>]+src="images\/writing\/usagi\.png"/);
  assert.match(html, /class="writing-button" href="writing\/">/);
  assert.match(renderWritingIndex(data), /href="\.\.\/writing\/homepage-refresh\.html"/);
  assert.match(renderWritingIndex({ ...data, writing: [] }), /<p class="writing-empty">No posts yet\.<\/p>/);
  assert.doesNotMatch(html, /acknowledgement\.html/);
  const withTalk = renderSite({ ...data, talks: [{ title: 'Invited talk', date: '2026-11-24', url: 'https://example.com/talk' }] });
  assert.match(withTalk, /href="#talks"/);
  assert.match(withTalk, /id="talks"/);
});

test('news is a scrollable list with an emoji for each existing event type', () => {
  assert.match(html, /class="news-window" role="group" aria-labelledby="news-title" tabindex="0"/);
  assert.doesNotMatch(html, /Earlier updates/);
  for (const mark of ['🎓', '🏆', '🎉']) {
    assert.ok(html.includes(`<span class="news-emoji" aria-hidden="true">${mark}</span>`));
  }
  assert.match(renderSite({ ...data, news: data.news.slice().reverse() }), /2026-11-12[^]*2024-11-15/);
});

test('the education row shows the college and rank', () => {
  const education = html.slice(html.indexOf('>Education</h3>'), html.indexOf('>Research internships</h3>'));
  assert.match(education, /College of Electronic and Information Engineering/);
  assert.match(education, /Major rank: 2\/85/);
  assert.doesNotMatch(education, /B\.Eng\./);
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
  const references = Array.from(html.matchAll(/(?:src|href)="((?:images|fonts)\/[^"]+|(?:style|tone)\.css|tone\.js)"/g), match => match[1]);
  await Promise.all(references.map(path => access(new URL('../public/' + path, import.meta.url))));
});

test('writing links to a focused article with the shared theme control', () => {
  const post = {
    title: 'Example article',
    date: '2026-01-01',
    slug: 'example-article',
    paragraphs: ['Read the [source](https://example.com/).'],
  };
  const article = renderArticle(data, post);
  const archive = renderWritingIndex({ ...data, writing: [
    post,
    { title: 'External post', date: '2026-02-01', url: 'https://example.com/post' },
  ] });
  assert.match(archive, /class="reading-watermark" src="\.\.\/images\/writing\/usagi\.png"[^>]*alt=""/);
  assert.equal((archive.match(/src="\.\.\/images\/writing\/usagi-ride\.png"/g) || []).length, 2);
  assert.match(archive, /href="https:\/\/example\.com\/post"[^]*href="\.\.\/writing\/example-article\.html"/);
  assert.doesNotMatch(renderWritingIndex({ ...data, writingAvatar: undefined, writingRideSprite: undefined }), /reading-watermark/);
  assert.doesNotMatch(html, /reading-watermark/);
  assert.doesNotMatch(article, /reading-watermark/);
  assert.match(article, /href="\.\.\/writing\/"/);
  assert.match(article, /<h1>Example article<\/h1>/);
  assert.match(article, /<div class="reading-prose"><p>.*<a href="https:\/\//);
  for (const page of [html, archive, article]) assert.match(page, /data-tone-input/);
  assert.throws(() => renderWritingIndex({ ...data, writing: [{ ...post, paragraphs: [] }] }), /Missing content/);

});

test('the showcase and its demo keep independent routes', async () => {
  const showcase = await readFile(new URL('../src/showcase.html', import.meta.url), 'utf8');
  assert.match(showcase, /<h1 id="hero-title">Cube Page<\/h1>/);
  assert.match(showcase, /href="demo\/"/);
  assert.match(showcase, /href="writing\/"/);
  const demo = renderSite(data, { demo: true });
  assert.match(demo, /<base href="\.\.\/">/);
  assert.match(demo, /href="demo\/#news"/);
  assert.match(demo, /href="writing\/" class="writing-nav-link"/);
  assert.match(renderWritingIndex(data, { demo: true }), /class="writing-back" href="\.\.\/demo\/"/);
  assert.doesNotMatch(html, /<base/);
});

test('edited content is escaped and script URLs are rejected', () => {
  const sample = renderSite({ ...data, bio: ['<script>example</script>'] });
  assert.match(sample, /&lt;script&gt;example/);
  assert.throws(() => renderSite({ ...data, social: [{ label: 'unsafe', url: 'javascript:alert(1)' }] }), /Unsupported URL/);
});
