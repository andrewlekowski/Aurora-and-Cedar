/* vCard for the business card QR code (HANDOVER §6.8). Built from site.config so NAP stays consistent. */
import { BUSINESS, SITE_URL } from '@4v/brand/site.config';
const e = (s: string) => s.replace(/([,;\\])/g, '\\$1');
export const GET = () => {
  const a = BUSINESS.address;
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:;${e(BUSINESS.name)};;;`, `FN:${e(BUSINESS.name)}`, `ORG:${e(BUSINESS.name)}`, `TITLE:${e(BUSINESS.subtitle)}`,
    `TEL;TYPE=CELL,VOICE;waid=${BUSINESS.whatsappDigits}:${BUSINESS.phoneIntl}`,
    `EMAIL;TYPE=INTERNET:${BUSINESS.email}`,
    BUSINESS.showAddress ? `ADR;TYPE=WORK:;;${e(a.street)};${e(a.city)};${a.region};${a.postalCode};Brasil` : `ADR;TYPE=WORK:;;;${e(a.city)};${a.region};;Brasil`,
    `URL:${SITE_URL}/`,
    `NOTE:${e('Manutenção de Equipamentos Médico, Laboratorial e Odontológico. Manutenção Corretiva e Preventiva. Equipamentos de Biossegurança. Cabine de Exaustão de Gases. Estufas. Autoclaves.')}`,
    'END:VCARD', '',
  ];
  return new Response(lines.join('\r\n'), { headers: { 'Content-Type': 'text/vcard; charset=utf-8', 'Content-Disposition': 'attachment; filename="4V_Manutencoes.vcf"' } });
};
