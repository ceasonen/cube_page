# Cube Page

A single-page academic homepage with a paper list, scrollable news panel and room for projects. The [live edition](https://ceasonen.github.io/cube_page/) uses Cheng Chen’s public academic profile and Rubik’s Cube photograph.

![Desktop preview showing the profile, introduction, news, and experience](docs/preview.jpg)

## Run locally

Use Node.js 22 or newer. There are no packages to install.

```sh
npm run build
npm test
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000/`. Open `dist/index.html` directly if you only want to preview the built page.

## Make it yours

| Item | Edit |
| --- | --- |
| Profile, email, social links and CV URLs | `content/site.json` |
| News, experience, publication credits, projects and awards | `content/site.json` |
| Writing, talks and reports | Use the matching arrays in `content/site.json`. For a writing entry, give a `slug` and `paragraphs` to generate an article, or a `url` to link elsewhere. |
| Portrait, logos, browser icon and paper figures | `public/images/` |
| Type, spacing and visual styles | `public/style.css` |
| HTML structure | `src/render.mjs` |

Dates in the news and writing arrays use `YYYY-MM-DD`. News is sorted newest first in a scrollable panel. A news entry can include an optional `emoji`. The Writing button opens the full post list at `writing/`, including when the list is empty. Talks and Reports show their headings with space for future entries. Set the site URL in the content file to the address where your copy is hosted.

The included workflow builds and tests the site before publishing. In a new repository, select **Settings → Pages → GitHub Actions** as the publishing source. The workflow publishes the `dist/` directory and supports a repository subpath.

The hue dial adjusts the accent, rules and page background. Visitors can drag it or use the arrow keys on the Hue control. The setting stays in their browser, with a reset button in the panel.

The example’s Writing avatar is [Usagi from the official Chiikawa anime site](https://www.anime-chiikawa.jp/). Replace `writingAvatar` in `content/site.json` with an image for your own site. Character artwork belongs to its respective rights holders.

## Design references

[WowPage](https://github.com/WD7ang/WowPage) by Weidong Tang and Yue Su informed the section structure and the split between content and templates. The visual reference was [Weidong Tang’s homepage](https://wd7ang.github.io/), especially its dated updates, institutional marks and publication thumbnails. [Nielsen Norman Group’s visual hierarchy guidance](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) informed the type scale and section spacing. Outfit is used for research and navigation, Caveat for the name and section headings, and Comic Neue for the introduction. The prose uses a constrained measure following the [W3C guidance on reflow and readability](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation).

The source code is MIT licensed. Outfit, Comic Neue, and Caveat are distributed with their [OFL notices](public/fonts/). Replace the profile photograph, paper illustrations, institutional marks and social icons with assets you can use on your own site.
