# Valdir / 4V Manutencoes — Business and Professional Profile

## Purpose and scope

This document exports the information established in the referenced **Business Card Design** conversation about Valdir and **4V Manutencoes**. It separates confirmed or finalized information from details that were discussed only as possibilities or were never established.

The spelling **4V Manutencoes** is intentional and was explicitly finalized for the card. It should not be changed to **4V Manutenções** unless Valdir later requests that change.

## Confirmed and finalized business information

| Field | Confirmed/finalized information | Notes |
|---|---|---|
| Person | Valdir | The current export request identifies him as Valdir. “Validr” is treated as a typo/alternate misspelling, not a separate person. His surname was not provided. |
| Business name | **4V Manutencoes** | Final spelling uses no accents. |
| Public-facing subtitle | **Assistência Técnica Especializada** | Used as the finalized business-card subtitle and vCard title. It is marketing wording, not evidence of a specific certification or professional registration. |
| Public-facing location | **São Paulo, Brazil** | Explicitly finalized for the card instead of “just Jacareí.” |
| Personal/local context | Valdir lives in **Jacareí, Brazil** | Established at the beginning of the conversation. This should not be treated as the confirmed service area. |
| WhatsApp / phone | **(12) 99788-1836** | Final Brazilian display format. International format: **+55 12 99788-1836**. WhatsApp digits: **5512997881836**. |
| Email | **4Vmanutencoes@gmail.com** | This is the later, finalized email used in the hardened design specification and vCard. |

## Confirmed services and professional activity

Valdir described the work as maintenance of:

- Medical equipment
- Laboratory equipment
- Dental equipment

The confirmed maintenance types are:

- Corrective maintenance
- Preventive maintenance

The equipment/service categories specifically mentioned are:

- Biosafety equipment
- Gas exhaust hoods/cabinets (*cabine de exaustão de gases*)
- *Estufas* (the Portuguese term used in the conversation; no more specific equipment type or English translation was established)

### What the conversation establishes about experience

The conversation establishes that Valdir works with the equipment categories and maintenance types listed above. It does **not** establish how many years he has worked in the field, where he trained, which employers or clients he has served, or whether he holds any certification, license, or professional registration.

## Location and service-area distinction

Two location statements appeared, and they refer to different contexts:

1. **Jacareí, Brazil** was provided as where Valdir lives.
2. **São Paulo, Brazil** was explicitly selected as the location shown on the finalized business card and in the vCard.

No exact service territory was confirmed. The conversation does not establish whether the business serves only Jacareí, the Vale do Paraíba region, the city of São Paulo, the entire state of São Paulo, nearby cities, or another defined area.

## Finalized contact information

### Current details

- Business/contact name: **4V Manutencoes**
- WhatsApp/phone: **(12) 99788-1836**
- International phone: **+55 12 99788-1836**
- Direct WhatsApp chat: `https://wa.me/5512997881836`
- Email: **4Vmanutencoes@gmail.com**
- Display location: **São Paulo, Brazil**

### Earlier detail that was superseded

An earlier email was provided as `numero4v100e.manutencoins@gmail.com`. It was later replaced in the finalized card specification and vCard by **4Vmanutencoes@gmail.com**. The earlier address should not be used unless Valdir reconfirms it.

## Finalized business-card and branding preferences

### Base design

- Rectangular, horizontal digital business card
- Final specified canvas: **1200 × 675 pixels**
- Pure white background
- Pure black lettering and artwork
- No colors other than black and white
- Clean, simple, professional, technical, and uncluttered appearance
- Modern sans-serif typography
- Strong, consistent typographic hierarchy
- Generous spacing and consistent alignment
- High-resolution PNG intended for digital sharing

### Required text hierarchy

1. **4V Manutencoes** — largest and boldest
2. **Assistência Técnica Especializada**
3. **Manutenção de Equipamentos Médico, Laboratorial e Odontológico**
4. Service list
5. WhatsApp, email, and location

### Service wording used in the finalized design

- Manutenção Corretiva e Preventiva
- Equipamentos de Biossegurança
- Cabine de Exaustão de Gases
- Estufas

### Vitruvian Man treatment

- Use the actual **Homem Vitruviano / Vitruvian Man** concept as a background watermark.
- Keep it black, with reduced opacity, behind the text.
- It must not overwrite or impair the readability of any information.
- The user tested several opacity levels during revisions. The last explicit opacity request was **15%**, after earlier 50% and 33% versions.

### Prohibitions in the finalized base design

The hardened base-card specification prohibited:

- Additional colors
- Gradients, shadows, textures, borders, dividers, and decorative clutter
- Icons, including WhatsApp, email, medical-cross, and gear icons
- Script or serif fonts
- Extra taglines or wording not supplied by the user

The base specification initially prohibited QR codes. That was later superseded for a separate smart-card version, where a small QR code was explicitly requested.

## Smart-card and vCard details

### Finalized vCard data

The optimized vCard was defined as version 3.0 with the following information:

```vcf
BEGIN:VCARD
VERSION:3.0
N:;4V Manutencoes;;;
FN:4V Manutencoes
ORG:4V Manutencoes
TITLE:Assistência Técnica Especializada
TEL;TYPE=CELL,VOICE;waid=5512997881836:+55 12 99788-1836
EMAIL;TYPE=INTERNET:4Vmanutencoes@gmail.com
ADR;TYPE=WORK:;;São Paulo;São Paulo;;Brazil
NOTE:Manutenção de Equipamentos Médico\, Laboratorial e Odontológico. Manutenção Corretiva e Preventiva. Equipamentos de Biossegurança. Cabine de Exaustão de Gases. Estufas.
END:VCARD
```

Suggested filename: **4V_Manutencoes.vcf**

### Embedded image behavior

A version of the vCard was created with the business-card image embedded as the vCard `PHOTO`. In contact applications, this image appears as the contact photo and may be cropped to a square. A vCard does not display a full rectangular business-card layout as a standalone page.

### WhatsApp sharing behavior established during testing

- Sending the `.vcf` as a WhatsApp **Document**, or sending the contact through WhatsApp’s built-in contact-sharing feature, was identified as the most direct save-contact workflow.
- A direct chat link was finalized as `https://wa.me/5512997881836`.
- A raw vCard payload embedded directly in a QR code did not work reliably in the WhatsApp scanner; it could display raw `BEGIN:VCARD` text instead of opening a save-contact prompt.
- The proposed reliable QR workflow was to host the `.vcf` at a public direct-download URL and encode that URL in the QR code.
- Google Drive, Dropbox, GitHub, Carrd, OneDrive, or a business-owned website were discussed as possible hosts, but **no final hosting provider or public `.vcf` URL was established**.
- WhatsApp’s native QR code opens a chat; it does not save the contact as a vCard.

### Smart-card visual placement

For the QR-enabled smart-card version, the user requested:

- A small, discreet QR code
- Positioned in the bottom-right corner
- Under/within the watermark area
- No existing design element or text overwritten
- The rest of the design left untouched

Because no public direct-download URL was finalized, the conversation does not establish that a final production QR code linking to a hosted `.vcf` was completed successfully.

## Unknown or not yet established

The following details were not provided or confirmed and must not be inferred:

- Valdir’s surname
- The meaning of “4V”
- Founding date or years in business
- Valdir’s years of professional experience
- Education, training, certifications, licenses, or registrations, including CREA or any other professional registration
- Formal job title such as owner, founder, technician, engineer, specialist, or responsible technical professional
- Whether Valdir works alone or has a team
- Team size
- Legal entity name, CNPJ, registration status, or business structure
- Street address or postal address
- Exact service area or list of cities served
- Customer types actually served, including whether the business works with clinics, hospitals, laboratories, dental offices, public agencies, or private companies
- Specific equipment brands, manufacturers, models, or technical specialties
- Installation, calibration, validation, inspection, testing, parts sales, or equipment sales
- Maintenance contracts, monthly plans, emergency service, turnaround times, or warranties
- Prices, estimates, payment methods, operating hours, or availability
- Website, social-media profiles, Google Maps listing, or business domain
- A final hosted `.vcf` URL
- A confirmed WhatsApp Business account or completed WhatsApp Business profile
- A final production-ready QR code that downloads the hosted contact file
- Any customer testimonials, portfolio items, completed projects, or performance claims

## Statements discussed only as suggestions, not facts

During the design discussion, ideas such as serving clinics and laboratories, offering fast service, contracts, free estimates, certifications, or showing years of experience were suggested as possible ways to strengthen the card. They were never confirmed and should not appear in factual business materials without Valdir’s approval and supporting information.

## Concise verified profile

**4V Manutencoes** provides corrective and preventive maintenance for medical, laboratory, and dental equipment. The services specifically mentioned include biosafety equipment, gas exhaust hoods/cabinets, and *estufas*. The finalized public contact details are WhatsApp **(12) 99788-1836**, email **4Vmanutencoes@gmail.com**, and location **São Paulo, Brazil**. Valdir lives in Jacareí, but the business’s exact service area and the remainder of his professional background have not yet been established.
