/* Routes, URLs, placeholder filling and JSON-LD. All business facts come from @4v/brand/site.config. */
import { SITE_URL, BUSINESS, fullAddress } from '@4v/brand/site.config';
import { pt } from '../content/pt';
import { en } from '../content/en';
import { fr } from '../content/fr';
import { LANGS, SERVICE_KEYS, type Content, type Lang, type PageKey, type ServiceKey, type PageMeta, type Faq, type ServicePage } from '../content/types';

export { LANGS, SERVICE_KEYS };
export type { Lang, PageKey, ServiceKey };

const VARS: Record<string, string> = {
  phone: BUSINESS.phoneDisplay,
  email: BUSINESS.email,
  since: String(BUSINESS.since),
};
export const fillVars = (s: string) => s.replace(/\{(phone|email|since)\}/g, (_, k) => VARS[k]);
function deepFill<T>(v: T): T {
  if (typeof v === 'string') return fillVars(v) as T;
  if (Array.isArray(v)) return v.map(deepFill) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepFill(x)])) as T;
  return v;
}
export const CONTENT: Record<Lang, Content> = { pt: deepFill(pt), en: deepFill(en), fr: deepFill(fr) };

/** Pages that get a URL in every language (404 is handled by src/pages/404.astro). */
export const PAGE_KEYS: PageKey[] = ['home', ...SERVICE_KEYS, 'experiencia', 'areas', 'contato', 'obrigado'];
export const NOINDEX: PageKey[] = ['obrigado', 'notfound'];

export function pageMeta(lang: Lang, key: PageKey): PageMeta {
  const c = CONTENT[lang];
  if ((SERVICE_KEYS as string[]).includes(key)) return c.services[key as ServiceKey];
  return c[key as Exclude<PageKey, ServiceKey>];
}
export const service = (lang: Lang, key: ServiceKey): ServicePage => CONTENT[lang].services[key];

/** Path for a page: PT at the root, EN under /en, FR under /fr. No trailing slash (except "/"). */
export function pathFor(lang: Lang, key: PageKey): string {
  const slug = pageMeta(lang, key).slug;
  const prefix = lang === 'pt' ? '' : `/${lang}`;
  if (key === 'home') return prefix || '/';
  return `${prefix}/${slug}`;
}
export const abs = (path: string) => SITE_URL.replace(/\/$/, '') + (path === '/' ? '/' : path);

export const ROUTES = LANGS.flatMap(lang => PAGE_KEYS.map(key => ({ lang, key, path: pathFor(lang, key) })));

/* ---------- JSON-LD ---------- */
export const BUSINESS_ID = abs('/') + '#business';

export function businessLd(lang: Lang) {
  const c = CONTENT[lang];
  const a = BUSINESS.address;
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': BUSINESS_ID,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    taxID: BUSINESS.cnpj,
    foundingDate: BUSINESS.foundingDate,
    description: c.home.lead,
    slogan: BUSINESS.subtitle,
    url: abs(pathFor(lang, 'home')),
    logo: abs('/logo.png'),
    image: abs('/og.jpg'),
    telephone: BUSINESS.phoneIntl.replace(/ /g, '-'),
    email: BUSINESS.email,
    areaServed: BUSINESS.areaServed.map(name => ({ '@type': 'Place', name })),
    founder: { '@type': 'Person', name: BUSINESS.person },
    knowsAbout: ['autoclave', 'estufa de laboratório', 'capela de exaustão de gases', 'cabine de segurança biológica', 'equipamentos odontológicos', 'bomba de vácuo', 'cardioversor'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: c.ui.servicesTitle,
      itemListElement: SERVICE_KEYS.map(k => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: c.services[k].serviceName, url: abs(pathFor(lang, k)) } })),
    },
  };
  if (BUSINESS.showAddress) {
    ld.address = { '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.city, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.country };
  }
  const sameAs = BUSINESS.sameAs.filter(Boolean);
  if (sameAs.length) ld.sameAs = sameAs;
  if (BUSINESS.geo) ld.geo = { '@type': 'GeoCoordinates', latitude: BUSINESS.geo.lat, longitude: BUSINESS.geo.lng };
  if (BUSINESS.openingHours) ld.openingHoursSpecification = BUSINESS.openingHours.map(o => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: o.days, opens: o.opens, closes: o.closes }));
  return ld;
}

export function breadcrumbLd(lang: Lang, key: PageKey) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: CONTENT[lang].ui.home, item: abs(pathFor(lang, 'home')) },
      { '@type': 'ListItem', position: 2, name: pageMeta(lang, key).nav, item: abs(pathFor(lang, key)) },
    ],
  };
}

export function serviceLd(lang: Lang, key: ServiceKey) {
  const s = service(lang, key);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.serviceName,
    serviceType: s.serviceName,
    description: s.description,
    url: abs(pathFor(lang, key)),
    provider: { '@id': BUSINESS_ID },
    areaServed: BUSINESS.areaServed.map(name => ({ '@type': 'Place', name })),
  };
}

export function faqLd(faq: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export { fullAddress };
