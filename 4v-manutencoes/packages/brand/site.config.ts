/**
 * Single source of truth for 4V Manutencoes business facts and URLs.
 * Only facts confirmed in HANDOVER.md §7 / §6.6 belong here. Never hard-code these in pages.
 */

/** Public website. Change this one value (plus 301s) if a custom domain is added later. */
export const SITE_URL = 'https://4vmanutencoes.pages.dev';
/** Private document app. The public site never links here. */
export const APP_URL = 'https://4v-documentos.pages.dev';

export const BUSINESS = {
  name: '4V Manutencoes',
  subtitle: 'Assistência Técnica Especializada',
  legalName: 'Valdir de Paula Bicudo',
  legalNameME: 'Valdir de Paula Bicudo ME',
  person: 'Valdir de Paula Bicudo',
  personShort: 'Valdir Bicudo',
  /** Approved by Andrew for publication on the website. */
  cnpj: '21.914.770/0001-10',
  ie: 'Isento',
  foundingDate: '2015-02-23',
  since: 2015,
  phoneDisplay: '(12) 99788-1836',
  phoneIntl: '+55 12 99788-1836',
  phoneE164: '+5512997881836',
  whatsappDigits: '5512997881836',
  email: '4Vmanutencoes@gmail.com',
  /** ⛔ HANDOVER §8: confirm with Valdir that this address is current and OK to show publicly. */
  showAddress: true,
  address: {
    street: 'Rua São Marcos, 126 – Jardim São José',
    city: 'Jacareí',
    region: 'SP',
    postalCode: '12327-668',
    country: 'BR',
  },
  /** Cities evidenced by past work (HANDOVER §6.3). Add others only after Valdir confirms them. */
  areaServed: ['Jacareí', 'São José dos Campos', 'Caraguatatuba', 'Ubatuba', 'Vale do Paraíba', 'Litoral Norte de São Paulo'],
  /** Fill after the Google Business Profile / social pages exist. Empty entries are dropped from JSON-LD. */
  sameAs: [] as string[],
  /** Add when Valdir confirms them (HANDOVER §6.5). */
  geo: null as null | { lat: number; lng: number },
  openingHours: null as null | { days: string[]; opens: string; closes: string }[],
} as const;

export const INTEGRATIONS = {
  /**
   * Web3Forms access key (free plan, delivers to 4Vmanutencoes@gmail.com). Public by design.
   * Get it at https://web3forms.com by entering the business email. Empty = the form is hidden
   * and only WhatsApp/e-mail buttons are shown.
   */
  web3formsKey: '',
  /** Cloudflare Web Analytics site token (free, cookieless). Empty = no beacon. */
  cfAnalyticsToken: '',
  /** Google Search Console HTML-tag verification code (content="..."). Empty = no tag. */
  googleSiteVerification: '',
  /** Bing Webmaster Tools msvalidate.01 code. Empty = no tag. */
  bingSiteVerification: '',
};

export const waLink = (text?: string) =>
  `https://wa.me/${BUSINESS.whatsappDigits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mailtoLink = (subject?: string) =>
  `mailto:${BUSINESS.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

export const telLink = () => `tel:${BUSINESS.phoneE164}`;

export const fullAddress = () => {
  const a = BUSINESS.address;
  return `${a.street}, ${a.city} – ${a.region}, CEP ${a.postalCode}`;
};
