import { readFileSync } from 'node:fs';

const toneControl = readFileSync(new URL('tone-control.html', import.meta.url), 'utf8');
const htmlCharacters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => htmlCharacters[character]);
}

function href(value) {
  if (/^(https?:\/\/|mailto:)/i.test(value)) return escapeText(value);
  if (/^(?:#[a-z][a-z0-9-]*|[a-z0-9][a-z0-9_./-]*)$/i.test(value) &&
      !value.split('/').some(part => part === '..')) return escapeText(value);
  throw new Error('Unsupported URL: ' + value);
}

function link(label, url, extra = '') {
  return '<a href="' + href(url) + '"' + extra + '>' + escapeText(label) + '</a>';
}

function dateLabel(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(date + 'T00:00:00Z'));
}

function inlineEmphasis(value) {
  return escapeText(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function section(id, label, body, decoration = '') {
  return `<section class="chapter" id="${id}" aria-labelledby="${id}-title">
    <h2 class="chapter-title" id="${id}-title">${escapeText(label)}${decoration}</h2>
    <div class="chapter-body">${body}</div>
  </section>`;
}

function emoji(mark, className = 'heading-emoji') {
  return mark ? `<span class="${className}" aria-hidden="true">${escapeText(mark)}</span>` : '';
}

function datedList(items) {
  return `<ul class="dated-list">${items.map(item => `<li>
      <time datetime="${escapeText(item.date)}">${dateLabel(item.date)}</time>
      <div class="dated-event">${emoji(item.emoji, 'news-emoji')}<span>${item.text ? inlineEmphasis(item.text) : link(item.title, item.url)}</span></div>
    </li>`).join('')}</ul>`;
}

function news(items) {
  return `<div class="news-window" role="group" aria-labelledby="news-title" tabindex="0">
    ${datedList(items.toSorted((first, second) => second.date.localeCompare(first.date)))}
  </div>`;
}

function mark(source) {
  return source ? `<img class="mark" src="${href(source)}" width="44" height="44" alt="" loading="lazy">` : '';
}

function experience(items) {
  return `<ul class="ledger">${items.map(item => `<li class="ledger-row">
    ${mark(item.logo)}
    <div><h3>${item.url ? link(item.name, item.url) : escapeText(item.name)}</h3>
    <p>${escapeText(item.role)}</p>${item.note ? `<p>${escapeText(item.note)}</p>` : ''}</div>
    <span class="row-date">${escapeText(item.date)}</span>
  </li>`).join('')}</ul>`;
}

function projects(items) {
  return `<ul class="project-list">${items.map(item => {
    const title = item.url || item.code ? link(item.name, item.url || item.code) : escapeText(item.name);
    const code = item.url && item.code ? link('Code', item.code, ` class="code-link" aria-label="Source code for ${escapeText(item.name)}"`) : '';
    return `<li><div><h3>${title}</h3><p>${escapeText(item.description)}</p></div>${code}</li>`;
  }).join('')}</ul>`;
}

function awards(items) {
  const legend = items.some(item => item.lead) ? '<p class="legend"><strong>#</strong> Project lead</p>' : '';
  return legend + `<ul class="ledger award-list">${items.map(item => `<li class="ledger-row">
    ${mark(item.logo)}<div><h3>${escapeText(item.name)}${item.lead ? ' <sup aria-label="Project lead">#</sup>' : ''}</h3>
    <p>${escapeText(item.prize)}</p></div><span class="row-date">${escapeText(item.date)}</span>
  </li>`).join('')}</ul>`;
}

function author(name, owner) {
  const [, text, roles] = name.match(/^(.*?)([*†‡]*)$/u);
  const display = text === owner ? `<strong>${escapeText(text)}</strong>` : escapeText(text);
  return display + (roles ? `<sup>${escapeText(roles)}</sup>` : '');
}

function papers(items, owner) {
  return items.map((item, index) => {
    const buttons = (item.links || []).map(entry => link(entry.label, entry.url)).join('');
    const cover = item.image ? `<figure class="paper-figure"><img src="${href(item.image)}"
        alt="${escapeText(item.imageAlt || item.title)}" width="220" height="136" loading="${index === 0 && !item.preprint ? 'eager' : 'lazy'}"></figure>` : '';
    return `<article class="paper${item.image ? ' has-figure' : ''}">
      ${cover}
      <div class="paper-body">
        <p class="paper-venue${item.preprint ? ' preprint' : ''}">${escapeText(item.venue)}</p>
        <h3>${escapeText(item.title)}</h3>
        <p class="paper-authors">${item.authors.map(name => author(name, owner)).join(', ')}</p>
        ${buttons ? `<p class="paper-links">${buttons}</p>` : ''}
        ${item.abstract ? `<details class="abstract"><summary>Abstract</summary><p>${escapeText(item.abstract)}</p></details>` : ''}
      </div></article>`;
  }).join('');
}

function postUrl(post) {
  if (!post.slug) return post.url;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) throw new Error('Invalid article slug: ' + post.slug);
  if (!post.paragraphs?.length) throw new Error('Missing content for article: ' + post.slug);
  return 'writing/' + post.slug + '.html';
}

function imageSource(asset, prefix) {
  const source = href(asset);
  return /^https?:\/\//i.test(source) ? source : prefix + source;
}

function writingImage(site, classes, prefix = '') {
  if (!site.writingAvatar) return '';
  return `<img class="${classes}" src="${imageSource(site.writingAvatar, prefix)}" width="48" height="48" alt="">`;
}

function writing(site) {
  if (!site.writing?.length) return '<p class="writing-empty">No posts yet.</p>';
  const posts = site.writing.toSorted((first, second) => second.date.localeCompare(first.date));
  return `<ul class="writing-list">${posts.map(post => {
    const url = href(postUrl(post));
    const target = /^(https?:\/\/|mailto:)/i.test(url) ? url : '../' + url;
    return `<li><a class="writing-entry" href="${target}">
      <span>${escapeText(post.title)}</span>
      <time datetime="${escapeText(post.date)}">${dateLabel(post.date)}</time>
    </a></li>`;
  }).join('')}</ul>`;
}

function linkedProse(text) {
  let markup = '';
  let start = 0;
  for (const match of text.matchAll(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/gi)) {
    markup += inlineEmphasis(text.slice(start, match.index)) + link(match[1], match[2]);
    start = match.index + match[0].length;
  }
  return markup + inlineEmphasis(text.slice(start));
}

function readingPage(site, pageTitle, content, { isArchive = false, demo = false } = {}) {
  const title = escapeText(pageTitle);
  const author = escapeText(site.name);
  const home = demo ? '../demo/' : '../';
  const back = isArchive
    ? `<a class="writing-back" href="${home}">← Home</a>`
    : `<a class="writing-back" href="../writing/">${writingImage(site, 'writing-nav-avatar', '../')}Writing</a>`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} · ${author}</title>
  <link rel="icon" href="../images/cube.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../style.css?v=20261126-usagi-trio">
  <link rel="stylesheet" href="../tone.css">
</head>
<body class="reading-page">
  <a class="skip-link" href="#article">Skip to content</a>
  <header class="masthead">
    <nav class="wrap masthead-inner" aria-label="Writing navigation">
      <a class="brand" href="${home}#about"><img src="../images/cube.svg" alt="" width="23" height="23"><span>${author}</span></a>
      ${back}
      ${toneControl}
    </nav>
  </header>
  <main id="article" class="reading-shell">
    ${content}
  </main>
  <script src="../tone.js" defer></script>
</body>
</html>
`;
}

export function renderWritingIndex(site, options = {}) {
  const sprite = site.writingRideSprite ? imageSource(site.writingRideSprite, '../') : '';
  const rides = sprite ? ['left', 'bottom'].map(position => `
    <span class="reading-watermark reading-watermark--ride reading-watermark--${position}" aria-hidden="true">
      <img src="${sprite}" width="634" height="415" alt="">
    </span>`).join('') : '';
  return readingPage(site, 'Writing', `
    ${writingImage(site, 'reading-watermark', '../')}${rides}
    <section class="writing-archive" aria-labelledby="writing-title">
      <header class="reading-heading"><h1 id="writing-title">Writing</h1></header>
      ${writing(site)}
    </section>`, { ...options, isArchive: true });
}

export function renderArticle(site, post, options = {}) {
  const date = new Intl.DateTimeFormat('en', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'})
    .format(new Date(post.date + 'T00:00:00Z'));
  return readingPage(site, post.title, `
    <article>
      <header class="reading-heading">
        <h1>${escapeText(post.title)}</h1>
        <p class="reading-byline"><span>${escapeText(site.name)}</span><time datetime="${escapeText(post.date)}">${escapeText(date)}</time></p>
      </header>
      <div class="reading-prose">${post.paragraphs.map(text => '<p>' + linkedProse(text) + '</p>').join('')}</div>
    </article>`, options);
}

export function renderSite(site, { demo = false } = {}) {
  const anchor = id => (demo ? 'demo/' : '') + '#' + id;
  const chapters = [];
  function add(id, label, body, navLabel = label) {
    const isWriting = id === 'writing';
    const avatar = isWriting ? writingImage(site, 'writing-nav-avatar') : '';
    const destination = isWriting ? 'writing/' : anchor(id);
    const nav = `<a href="${destination}"${isWriting ? ' class="writing-nav-link"' : ''}>${avatar}${escapeText(navLabel)}</a>`;
    const decoration = isWriting ? writingImage(site, 'writing-heading-avatar') : (id === 'projects' ? emoji('🛠️') : '');
    chapters.push({ nav, html: section(id, label, body, decoration) });
  }
  if (site.news.length) add('news', 'News', news(site.news));
  if (site.education.length || site.internships.length) {
    const education = site.education.length ? '<h3 class="subheading">Education</h3>' + experience(site.education) : '';
    const internships = site.internships.length ? '<h3 class="subheading">Research internships</h3>' + experience(site.internships) : '';
    add('experience', 'Experience', education + internships);
  }
  if (site.projects.length) add('projects', 'Projects', projects(site.projects));
  if (site.awards.length) add('awards', 'Honors and Awards', awards(site.awards), 'Awards');
  if (site.publications.length) {
    const publications = site.publications.filter(paper => !paper.preprint);
    const preprints = site.publications.filter(paper => paper.preprint);
    const legend = '<p class="legend author-legend"><span><strong>*</strong> Equal contribution</span><span><strong>†</strong> Corresponding author</span><span><strong>‡</strong> Project lead</span></p>';
    add('publications', 'Publications', legend + papers(publications, site.name) +
      (preprints.length ? '<h3 class="subheading paper-group">Preprints</h3>' + papers(preprints, site.name) : ''));
  }
  add('writing', 'Writing', '<a class="writing-button" href="writing/">View all posts <span aria-hidden="true">→</span></a>');
  for (const [id, label] of [['talks', 'Talks'], ['reports', 'Reports']]) {
    add(id, label, site[id]?.length ? datedList(site[id]) : '');
  }
  if (site.reviewer.length) {
    add('service', 'Academic Service', `<h3 class="subheading">Reviewer</h3><ul class="service-list">${site.reviewer
      .map(venue => '<li>' + escapeText(venue) + '</li>').join('')}</ul>`, 'Service');
  }
  const cvs = site.cvs.map(item => link(item.label, item.url, ` hreflang="${escapeText(item.lang)}"`)).join('');
  const profiles = site.social.map(item => {
    const image = item.image || (item.icon && 'images/social/' + item.icon + '.svg');
    const icon = image ? `<img src="${href(image)}" width="15" height="15" alt="">` : '';
    return `<li><a href="${href(item.url)}">${icon}${escapeText(item.label)}</a></li>`;
  }).join('');
  const name = escapeText(site.name);
  const email = link(site.email, 'mailto:' + site.email);
  const portrait = site.portrait?.src ? `<figure class="profile-art">
        <img class="portrait" src="${href(site.portrait.src)}" alt="${escapeText(site.portrait.alt)}" width="1280" height="1365" fetchpriority="high">
      </figure>` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeText(site.description)}">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:title" content="${name}">
  <meta property="og:description" content="${escapeText(site.description)}">
  <title>${name}</title>
  ${demo ? '<base href="../">' : ''}
  ${site.url ? `<link rel="canonical" href="${href(demo ? new URL('demo/', site.url).href : site.url)}">` : ''}
  <link rel="icon" href="images/cube.svg" type="image/svg+xml">
  <link rel="preload" href="fonts/outfit-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/caveat-bold.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/comic-neue.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="tone.css">
</head>
<body>
  <a class="skip-link" href="${anchor('about')}">Skip to content</a>
  <header class="masthead">
    <div class="wrap masthead-inner">
      <a class="brand" href="${anchor('about')}" aria-label="${name} · Homepage"><img src="images/cube.svg" alt="" width="36" height="36"></a>
      <nav class="site-nav" aria-label="Sections"><a href="${anchor('about')}">About</a>${chapters.map(item => item.nav).join('')}</nav>
      ${cvs ? `<nav class="cv-nav" aria-label="Curriculum vitae">${cvs}</nav>` : ''}
      ${toneControl}
    </div>
  </header>
  <div class="wrap page-layout">
    <aside class="profile" aria-labelledby="name">
      ${portrait}
      <div class="identity">
        <h1 id="name">${name}</h1>
        <p class="affiliation">${site.affiliationUrl ? link(site.affiliation, site.affiliationUrl) : escapeText(site.affiliation)}</p>
        <p class="college">${escapeText(site.college)}</p>
        <p class="location">${escapeText(site.location)}</p>
      </div>
      <ul class="profiles" aria-label="Profiles">${profiles}</ul>
    </aside>
    <main>
      <section class="intro" id="about" aria-labelledby="about-title">
        <h2 id="about-title">About${emoji('👋')}</h2>
        <div class="bio">${site.bio.map(paragraph => '<p>' + escapeText(paragraph) + '</p>').join('')}</div>
        <p class="contact">Feel free to email me at ${email}.</p>
      </section>
      ${chapters.map(item => item.html).join('\n      ')}
    </main>
  </div>
  <footer class="wrap footer">
    <span>${name}</span>
    <a href="${demo ? './' : 'https://github.com/ceasonen/cube_page'}">Cube Page</a>
    <a href="${anchor('about')}">Back to top</a>
  </footer>
  <script src="tone.js" defer></script>
</body>
</html>
`;
}
