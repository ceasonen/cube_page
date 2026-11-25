import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderSite } from '../src/render.mjs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('content/site.json', root), 'utf8'));
const destination = new URL('dist/', root);

await mkdir(destination, { recursive: true });
await cp(new URL('public/', root), destination, { recursive: true });
await writeFile(new URL('index.html', destination), renderSite(config));
await writeFile(new URL('.nojekyll', destination), '');
console.log('Built dist/index.html');
