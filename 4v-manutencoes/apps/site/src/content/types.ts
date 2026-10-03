export type Lang = 'pt' | 'en' | 'fr';
export const LANGS: Lang[] = ['pt', 'en', 'fr'];

export type ServiceKey = 'autoclave' | 'odonto' | 'estufa' | 'capela' | 'bio' | 'hospitalar' | 'remanejamento';
export type PageKey = 'home' | ServiceKey | 'experiencia' | 'areas' | 'contato' | 'obrigado' | 'notfound';
export const SERVICE_KEYS: ServiceKey[] = ['autoclave', 'odonto', 'estufa', 'capela', 'bio', 'hospitalar', 'remanejamento'];

export interface Faq { q: string; a: string }
export interface Section { h2: string; paras?: string[]; list?: string[] }

export interface PageMeta {
  slug: string;          // '' for the language home
  title: string;         // <title>, ≤ 60 chars
  description: string;   // ≤ 155 chars
  h1: string;
  nav: string;           // short label for menus and breadcrumbs
  waText: string;        // prefilled WhatsApp message
  mailSubject: string;   // mailto subject
}

export interface ServicePage extends PageMeta {
  serviceName: string;   // schema.org Service name
  card: string;          // one-line description for service grids
  intro: string[];
  problems: string[];
  sections: Section[];
  faq: Faq[];
  related: [ServiceKey, ServiceKey];
}

export interface UI {
  htmlLang: string;
  ogLocale: string;
  langName: string;
  skip: string;
  menu: string;
  home: string;
  waBtn: string;
  mailBtn: string;
  callBtn: string;
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  cnpjLabel: string;
  servicesTitle: string;
  problemsTitle: string;
  faqTitle: string;
  relatedTitle: string;
  seeExperience: string;
  warrantyTitle: string;
  warrantySeal: [string, string, string, string];
  warrantyPoints: string[];
  contactTitle: string;
  contactLead: string;
  howTitle: string;
  howSteps: string[];
  areasLine: string;
  langSwitch: string;
  footerServices: string;
  footerAbout: string;
  form: {
    title: string; lead: string; name: string; org: string; city: string; phone: string; email: string;
    equipment: string; equipmentHint: string; message: string; send: string; required: string; tooFast: string; subject: string;
  };
  portraitAlt: string;
  logoAlt: string;
  vcard: string;
  photoCaptionTitle: string;
  photoCaption: string;
}

export interface Content {
  ui: UI;
  home: PageMeta & {
    eyebrow: string; lead: string; servicesLead: string;
    expTitle: string; expLead: string; expMore: string;
    faq: Faq[]; areasTitle: string; areasText: string; areasMore: string;
  };
  services: Record<ServiceKey, ServicePage>;
  experiencia: PageMeta & {
    lead: string; sinceLabel: string; uniTitle: string; uniLead: string; unis: [string, string][];
    publicTitle: string; publicItems: [string, string][]; eqTitle: string; equipment: string[];
    otherTitle: string; other: string[]; note: string;
  };
  areas: PageMeta & { paras: string[]; citiesTitle: string; cities: string[]; regionsTitle: string; regions: string[]; outside: string };
  contato: PageMeta & { lead: string; tips: string[]; tipsTitle: string };
  obrigado: PageMeta & { lead: string; back: string };
  notfound: PageMeta & { lead: string; back: string };
}
