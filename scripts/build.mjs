import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderArticle, renderSite, renderWritingIndex } from '../src/render.mjs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('content/site.json', root), 'utf8'));
const destination = new URL('dist/', root);

await mkdir(destination, { recursive: true });
await cp(new URL('public/', root), destination, { recursive: true });
await writeFile(new URL('index.html', destination), renderSite(config));
await mkdir(new URL('writing/', destination), { recursive: true });
await writeFile(new URL('writing/index.html', destination), renderWritingIndex(config));
for (const post of config.writing || []) {
  if (!post.slug || !post.paragraphs?.length) continue;
  await writeFile(new URL('writing/' + post.slug + '.html', destination), renderArticle(config, post));
}
await writeFile(new URL('.nojekyll', destination), '');
console.log('Built dist/index.html');
