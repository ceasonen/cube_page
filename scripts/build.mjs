import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderArticle, renderSite, renderWritingIndex } from '../src/render.mjs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('content/site.json', root), 'utf8'));
const demo = !process.argv.includes('--site-only');
const destination = new URL(demo ? 'dist/' : 'site-dist/', root);

await mkdir(destination, { recursive: true });
await cp(new URL('public/', root), destination, { recursive: true });
if (demo) {
  await cp(new URL('src/showcase.html', root), new URL('index.html', destination));
  await cp(new URL('docs/preview.jpg', root), new URL('images/demo-preview.jpg', destination));
  await cp(new URL('docs/preview-mobile.jpg', root), new URL('images/demo-preview-mobile.jpg', destination));
  await mkdir(new URL('demo/', destination), { recursive: true });
}
await writeFile(new URL(demo ? 'demo/index.html' : 'index.html', destination), renderSite(config, { demo }));
await mkdir(new URL('writing/', destination), { recursive: true });
await writeFile(new URL('writing/index.html', destination), renderWritingIndex(config, { demo }));
for (const post of config.writing || []) {
  if (!post.slug || !post.paragraphs?.length) continue;
  await writeFile(new URL('writing/' + post.slug + '.html', destination), renderArticle(config, post, { demo }));
}
await writeFile(new URL('.nojekyll', destination), '');
console.log(demo ? 'Built dist/index.html and dist/demo/index.html' : 'Built site-dist/index.html');
