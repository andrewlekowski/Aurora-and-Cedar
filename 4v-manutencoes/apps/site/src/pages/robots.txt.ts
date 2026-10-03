import { SITE_URL } from '@4v/brand/site.config';
export const GET = () => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL.replace(/\/$/, '')}/sitemap-index.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
