import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from '../../packages/brand/site.config.ts';
import { ROUTES, NOINDEX, LANGS, CONTENT, abs, pathFor } from './src/lib/site.ts';

// Every page links to its translations (slugs differ per language, so we map them ourselves).
const noindexUrls = new Set(ROUTES.filter(r => NOINDEX.includes(r.key)).map(r => abs(r.path)));
const linksByUrl = new Map(ROUTES.map(r => [abs(r.path), [
  ...LANGS.map(l => ({ lang: CONTENT[l].ui.htmlLang, url: abs(pathFor(l, r.key)) })),
  { lang: 'x-default', url: abs(pathFor('pt', r.key)) },
]]));
const norm = u => (u.endsWith('/') && u !== SITE_URL + '/' ? u.slice(0, -1) : u);

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  compressHTML: true,
  integrations: [
    sitemap({
      filter: page => !noindexUrls.has(norm(page)) && !/\/404$/.test(norm(page)),
      serialize(item) {
        item.url = norm(item.url);
        item.links = linksByUrl.get(item.url) || [];
        return item;
      },
    }),
  ],
});
