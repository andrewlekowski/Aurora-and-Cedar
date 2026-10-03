# 4V Manutencoes — single-file web app spec

Output: ONE file `build/index.html` (in this scratchpad dir). No `<!doctype>/<html>/<head>/<body>` tags — start with `<title>4V Manutencoes</title>`, then `<link>` Google Fonts, `<style>`, markup, `<script>`. It is published as a claude.ai Artifact (sandboxed iframe).

## Hard platform rules
- External scripts ONLY from cdn.jsdelivr.net/npm/ (pinned). Load lazily (inject `<script>` on first download click):
  - `https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js` (global `html2pdf`)
  - `https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js` (global `docx`)
  - Local copies for testing: `libs/html2pdf.js-0.10.1/package/dist/html2pdf.bundle.min.js`, `libs/docx-8.5.0/package/build/index.umd.js`.
- Fonts: Google Fonts only: `Archivo` (wdth,wght axes: `family=Archivo:wdth,wght@62..125,400..800`) for display, `Atkinson Hyperlegible` 400/700 for body. Real fallbacks.
- NO window.print, NO alert/confirm/prompt (build inline confirm UI), NO `<a download>`. Files are saved ONLY via:
  ```js
  const dl = await window.claude?.use?.("downloads"); // null => unavailable
  await dl.save({filename:"x.pdf", data: blob}) // rejects {code}: "declined" => show "cancelled"; others => show unavailable msg
  ```
  If `window.claude?.use` is missing or returns null, show message "can't download here, use Copy text".
- localStorage for everything persisted (lang, saved clients, company data, per-doc drafts, doc counters). Wrap every access in try/catch; page must work without it.
- `https://wa.me/...` links OK as real `<a href target=_blank>`. Show phone/email as selectable text + Copy button (navigator.clipboard.writeText in click handler, catch → select text fallback).
- Must work at 360–400px width (PRIMARY: user is a 60+ man using only his PHONE) with 16px side gutter, no horizontal scroll. Base font 19px, inputs 20px, buttons min-height 56px, big tap targets, high contrast, plain words.
- Theme: define every color as tokens on `:root` (light), redefine under `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){...;color-scheme:dark}}` AND `:root[data-theme="dark"]{...}`. body gets explicit background. Document "paper" preview always white with black ink in both themes. Logo is black ink PNG → use `filter: var(--logo-filter)` (none / invert(1) in dark).
- Every form control gets a stable `id`. Visible focus states. Respect prefers-reduced-motion.

## Brand (finalized — do not change)
- Name spelled exactly **4V Manutencoes** (no accents). Subtitle "Assistência Técnica Especializada".
- Black & white only, modern sans-serif, generous spacing, clean/technical. The Vitruvian Man is the logo/watermark (≈15% opacity when used as watermark). No emoji, no icon clutter, no gradients. Square-ish shapes, 2px solid borders, radius ~12px. Allowed semantic colors only for status text (success/error).
- Images: `logo_k.png` (240px black-ink transparent Vitruvian Man) and `valdir_bw.jpg` (grayscale portrait). Embed as base64 data URIs (write a small python build step that replaces `__LOGO__` and `__PHOTO__` placeholders).
- Contact: WhatsApp (12) 99788-1836 → `https://wa.me/5512997881836`; email 4Vmanutencoes@gmail.com; public location "São Paulo, Brasil".
- Services (only these): Manutenção corretiva; Manutenção preventiva; Equipamentos de biossegurança; Cabine de exaustão de gases; Estufas; Autoclaves; Equipamentos odontológicos. Areas: médico, laboratorial, odontológico.
- Confirmed claims ONLY: every service has a **minimum 3-month warranty**; **warranty service is free of charge**; client receives warranty term + usage instructions in writing. Do NOT invent years in business, certifications, testimonials, client lists, service area, prices.

## Language toggle — PT (default) / EN / FR
A big segmented control "PT | EN | FR" in the top bar of EVERY view. Switches ALL UI text AND the generated documents' text. Persist in localStorage. All strings in one `I18N = {pt:{}, en:{}, fr:{}}` object (UI) and `DOCT = {pt:{}, en:{}, fr:{}}` (document text). Write natural, correct Brazilian Portuguese (with accents), English and French. Dates via `Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric'})` with pt-BR / en-US / fr-FR. Money format "1.200,00" in PT/FR style `R$ 1.200,00` for all languages (it's Brazilian reais); amount-in-words in the active language (see below).

## Views (hash routing with bare tokens: #inicio default, #site, #garantia, #entrega, #contrato, #recibo, #clientes, #dados; read location.hash on load + hashchange; scroll to top on change)
Top bar on every view: small logo + "4V Manutencoes", lang toggle. Every non-home view has a big "← Voltar ao início" button at top.

### #inicio (hub for Valdir)
- Round grayscale photo + greeting by local hour ("Bom dia/Boa tarde/Boa noite, Valdir").
- "Qual documento você quer fazer hoje?" then 4 big tiles (title + one plain sentence):
  - Termo de Garantia — after a repair; says what was done and how long the warranty lasts.
  - Termo de Entrega e Orientações — when handing equipment back; lists usage care for the client to sign.
  - Contrato de Venda de Equipamento — when selling equipment; writes the price in words automatically.
  - Recibo — when receiving a payment.
- "Como funciona" (real 3-step sequence, numbered): 1 Escolha o documento. 2 Preencha os campos — o que ficar em branco sai com uma linha para preencher à mão. 3 Baixe em PDF ou Word e envie pelo WhatsApp.
- "Outras opções" tiles: Meus clientes, Meus dados, Ver meu site.
- Small note: "Seus clientes e dados ficam salvos neste aparelho."

### #site (public advertising landing page — will become his real website)
Editorial but on-brand B&W. Sections: hero (eyebrow subtitle; H1 "Manutenção de equipamentos médicos, laboratoriais e odontológicos."; lead "Manutenção corretiva e preventiva, com garantia por escrito em todos os serviços."; big black "Chamar no WhatsApp" button → wa.me with prefilled text in active language; number shown + Copy; large faint Vitruvian watermark behind); photo card "Valdir Bicudo — Fale direto com o Valdir pelo WhatsApp."; Serviços grid; Garantia section with a "warranty seal" graphic (dashed-ring circular seal: "GARANTIA MÍNIMA · 3 MESES · EM TODOS OS SERVIÇOS") + 3 bullets (claims above); Como funciona 4 steps (1 Chame no WhatsApp e conte qual é o equipamento e o problema. 2 O equipamento é avaliado. 3 O serviço é feito e testado. 4 Você recebe o equipamento com termo de garantia e orientações de uso.); Contato (WhatsApp, e-mail, São Paulo, Brasil, copy buttons); footer "4V Manutencoes · CNPJ 21.914.770/0001-10" + small link "Área de documentos" → #inicio.

### Document editors (#garantia, #entrega, #contrato, #recibo)
Layout: phone = single column: form sections then "Documento pronto" section with live preview + buttons. Desktop ≥1000px: form left, sticky live preview right. Phone: fixed bottom bar (safe-area padding) with "Ver documento" (scrolls to preview) and "Baixar PDF".
- Top: tip "Deixe em branco o que quiser preencher à mão depois." + "Começar um documento novo" (inline confirm: "Apagar tudo e começar de novo?" Sim/Não). New doc increments number.
- Form sections numbered (real order). Fields grouped; labels above inputs, big.
- Empty field ⇒ document shows a blank line `______________` (length suits the field). This is the "fill by hand" option.
- Live preview re-renders on every input (debounce ~150ms). Draft autosaves per doc in localStorage.
- Preview: paper element 794px wide (A4 @96dpi), scaled to fit container with CSS transform + wrapper height set by JS.
- Buttons: **Baixar PDF** (primary), **Baixar Word** (.docx), **Copiar texto** (plain text of the document, for WhatsApp). Status line (aria-live) shows "Preparando o arquivo…", "Arquivo pronto.", errors.
- Filenames: e.g. `Termo-de-Garantia-G-2026-001-<ClientName>.pdf` (sanitize; translate prefix per language).

Client block (shared by all docs; keys cli_*): at top a select "Usar um cliente salvo" (fills fields) + button "Salvar este cliente" (saves/updates in localStorage list). Fields: Nome do cliente ou da instituição; Aos cuidados de (pessoa e setor); CPF ou CNPJ; Endereço (rua, número, bairro); Cidade – UF; CEP; Telefone; E-mail. Contract adds: Comprador é [Pessoa física | Empresa] (radio chips), RG + Nacionalidade (PF only), Representante (nome e CPF) (PJ only). Recibo uses only nome + CPF/CNPJ.

Document meta (all docs): Número (default `G-2026-001` style: prefix G/E/C/R + year + 3-digit counter from localStorage), Data do documento (date input, default today), Cidade (default from Meus dados, "Jacareí").

Chips (big radio pills) for: warranty term [3 meses (mínimo) | 6 meses | 12 meses | Outro → text input], default 3 meses. Doc wording: "3 (três) meses", "6 (seis) meses", "12 (doze) meses" (translated).

#### Termo de Garantia de Serviço (prefix G)
Form: meta; cliente; equipamento (Tipo [select: Autoclave, Cadeira / equipo odontológico, Estufa, Cabine de exaustão de gases, Cabine de segurança biológica, Outro], Equipamento (como deve aparecer, e.g. "Autoclave 12 litros"), Marca, Modelo, Nº de série, Tensão [127 V | 220 V | Bivolt]); serviço (Data do serviço, O que foi feito [textarea], Peças trocadas [rows: Qtd + Peça; add/remove buttons]); garantia (prazo chips, "A garantia começa em" date default = doc date); observações.
Document:
- Header (all docs): logo 56px + "4V Manutencoes" (Archivo bold) + subtitle + line "WhatsApp (12) 99788-1836 · 4Vmanutencoes@gmail.com · CNPJ 21.914.770/0001-10" + optional address line; 2px black rule under.
- Title "TERMO DE GARANTIA DE SERVIÇO", right-aligned "Nº G-2026-001".
- Section "Cliente" (2-col key/value table: Nome / instituição, A/C, CPF / CNPJ, Endereço, Cidade, Telefone, E-mail — omit rows that are empty? NO: keep rows with blank lines for Nome, CPF/CNPJ, Endereço; omit A/C, Telefone, E-mail rows when empty).
- Section "Equipamento" (Equipamento, Marca, Modelo, Nº de série, Tensão).
- Section "Serviço executado": Data do serviço; Descrição; table Qtd. | Peça substituída (if no rows → 3 blank rows).
- Section "Garantia" paragraphs:
  1. "A **4V Manutencoes** garante o serviço descrito acima pelo prazo de **{prazo}**, contado a partir de **{inicio}**."
  2. "Esta garantia cobre a mão de obra do serviço executado e as peças substituídas listadas acima. Ela é complementar à garantia legal prevista no Código de Defesa do Consumidor (arts. 26 e 50)."
  3. "O atendimento em garantia não tem custo para o cliente."
  4. "Para acionar a garantia, entre em contato pelo WhatsApp **{tel}** ou pelo e-mail **{email}** e informe o número deste termo."
- "A garantia não cobre:" bullets: Uso em desacordo com o manual do fabricante. / Ligação em tensão elétrica errada, quedas, batidas, descargas elétricas ou variações da rede. / Abertura ou conserto por terceiros, ou selo de garantia rompido. / Peças e componentes que não foram trocados neste serviço. / Desgaste natural de itens de consumo e falta da limpeza ou manutenção indicadas.
- Observações (only if filled).
- "{cidade}, {data}." right-aligned. Two signature columns with lines: "{responsável} — Técnico responsável, 4V Manutencoes" | "Cliente — nome, cargo e carimbo" + "Data: ___/___/______".

#### Termo de Entrega Técnica e Orientações de Uso (prefix E)
Form: meta; cliente; equipamento (same as above); orientações: checklist generated from equipment Tipo — each item = big checkbox + editable auto-growing textarea; "Adicionar orientação" button. Items keep a `key` so untouched items re-translate on language change; edited items keep custom text. Changing Tipo reloads the preset list (inline confirm if items were edited). Garantia: toggle "Incluir o prazo de garantia no documento" (default on) + prazo chips; observações.
Document: header; title; Nº; "A/C" block (Cliente, A/C); intro "Entregamos o equipamento abaixo revisado e em funcionamento, com as seguintes orientações de uso:"; equipment table; numbered orientations; (if toggle) "Este equipamento tem garantia de **{prazo}** a partir de **{data}**. O atendimento em garantia não tem custo para o cliente."; "Declaro que recebi o equipamento em funcionamento e as orientações acima."; place/date; signatures "Entregue por: {responsável}, 4V Manutencoes" | "Recebido por — nome, cargo e carimbo" + date line.
Presets (write PT; translate EN/FR). Every list ends with the two common items SELO and CONTATO.
- autoclave: Acompanhe o equipamento durante o ciclo: o aviso sonoro de mudança de fase e de fim de ciclo é baixo. / Coloque somente a quantidade de material indicada no manual do fabricante. Deixe espaço para a circulação do vapor e não obstrua a saída de vapor. / Respeite o intervalo entre um ciclo e outro indicado no manual. / Use somente água destilada no reservatório. / Limpe a câmara interna uma vez por semana. / Verifique sempre se a mangueira de saída de vapor não está obstruída.
- odonto: Ligue o equipamento somente na tensão elétrica indicada na etiqueta. / Ao fim de cada atendimento, aspire água limpa pelo sugador e limpe a cuspideira. / Lubrifique as canetas (alta rotação e micromotor) conforme a orientação do fabricante. / Drene diariamente a água acumulada no compressor de ar. / Desligue a chave geral ao fim do expediente. / Não use produtos abrasivos ou solventes no estofamento e nas partes plásticas.
- estufa: Ligue o equipamento somente na tensão elétrica indicada na etiqueta. / Não ultrapasse a temperatura máxima indicada pelo fabricante. / Não obstrua as aberturas de ventilação e deixe espaço entre o material e as paredes internas. / Aguarde a estufa esfriar antes de abrir para limpeza. / Limpe a câmara interna com pano úmido e sabão neutro; não use produtos abrasivos.
- exaustao: Ligue o exaustor antes de começar o trabalho e mantenha-o ligado durante todo o uso. / Trabalhe com a janela (guilhotina) na altura indicada pelo fabricante. / Não guarde produtos ou materiais dentro da cabine. / Não bloqueie as aberturas de exaustão. / Limpe a superfície de trabalho após o uso.
- bio: Ligue a cabine antes do uso e aguarde o tempo de estabilização indicado pelo fabricante. / Nunca use a lâmpada UV com o operador presente. / Não bloqueie as grelhas frontal e traseira. / Desinfete a superfície de trabalho antes e depois do uso, conforme o protocolo do laboratório. / Respeite a periodicidade de manutenção preventiva indicada pelo fabricante.
- outro: Ligue o equipamento somente na tensão elétrica indicada na etiqueta. / Siga as instruções do manual do fabricante. / Mantenha o equipamento limpo e em local ventilado.
- SELO: Confira o selo de garantia no ato da entrega. Selo rompido cancela a garantia.
- CONTATO: Em caso de dúvida ou falha durante o uso, interrompa o funcionamento e entre em contato com o suporte técnico: WhatsApp {tel}.

#### Contrato Particular de Compra e Venda de Equipamento (prefix C)
Form: meta; comprador (client block + PF/PJ); equipamentos (rows: Descrição (tipo, marca, modelo) + Nº de série; add/remove; default 1 row) + Estado [Usado e revisado | Novo | Recondicionado]; preço (Valor R$ — numeric input accepting "1200" or "1.200,00"; read-only "Por extenso (automático)" display; Forma de pagamento chips [À vista, na entrega | PIX | Parcelado | Outro→text] + Detalhes (opcional)); entrega (Data da entrega default today; Como [O comprador retira | Transportadora do comprador | Eu entrego]); garantia prazo chips; foro (default from Meus dados "Jacareí – SP"); Testemunha 1 / 2 (nome e CPF, optional).
Document: header; title; Nº; parties:
- "**{razão social}**, inscrita no CNPJ sob o nº {cnpj}, Inscrição Estadual {ie}, com sede em {endereço}, {cidade}, CEP {cep}, neste ato representada por {responsável}, doravante denominada simplesmente **VENDEDOR**."
- PF: "**{nome}**, {nacionalidade}, portador(a) do RG nº {rg}, inscrito(a) no CPF sob o nº {doc}, residente em {end}, {cidade}, CEP {cep}, doravante denominado(a) simplesmente **COMPRADOR**." / PJ: "**{nome}**, inscrita no CNPJ sob o nº {doc}, com sede em {end}, {cidade}, CEP {cep}, neste ato representada por {rep}, doravante denominada simplesmente **COMPRADOR**."
- "As partes acima têm entre si justo e contratado o que segue:"
- CLÁUSULA 1ª – DO OBJETO: O VENDEDOR declara ser o legítimo proprietário do(s) equipamento(s) abaixo, que vende ao COMPRADOR no estado **{estado}**: [table Equipamento | Nº de série]
- CLÁUSULA 2ª – DO PREÇO E DO PAGAMENTO: O preço total, justo e certo, é de **R$ {valor} ({extenso})**, pago da seguinte forma: {pagamento}{; detalhes}.
- CLÁUSULA 3ª – DA ENTREGA E DA POSSE: O COMPRADOR toma posse do equipamento em **{data}**, data a partir da qual passa a responder por sua guarda e conservação.
- CLÁUSULA 4ª – DO TRANSPORTE: retira → "O equipamento será retirado pelo COMPRADOR, sem custo para o VENDEDOR." / transp → "O equipamento será despachado por transportadora indicada pelo COMPRADOR, que arcará com o frete e com os riscos do transporte." / vend → "O VENDEDOR entregará o equipamento no endereço do COMPRADOR."
- CLÁUSULA 5ª – DA ORIGEM E DOS ÔNUS: O VENDEDOR garante que o equipamento está livre e desembaraçado de qualquer ônus, dívida, penhora ou restrição. Caso o equipamento venha a ser retirado do COMPRADOR por motivo anterior a esta venda, o VENDEDOR devolverá o valor recebido, corrigido monetariamente e acrescido dos juros legais.
- CLÁUSULA 6ª – DA GARANTIA: a) O VENDEDOR concede garantia de **{prazo}** contra defeitos de funcionamento, contada da data de entrega do equipamento. b) A garantia perde a validade se o selo de garantia for rompido, se o equipamento sofrer queda, acidente ou dano causado por terceiros, ou se for ligado em tensão elétrica errada. c) O atendimento em garantia não tem custo para o COMPRADOR, que deve acioná-lo pelo WhatsApp {tel} ou pelo e-mail {email}.
- CLÁUSULA 7ª – DA INSTALAÇÃO E DO USO: O COMPRADOR declara ter recebido o equipamento testado e em funcionamento e se compromete a instalá-lo e utilizá-lo conforme o manual do fabricante, na tensão elétrica correta.
- CLÁUSULA 8ª – DISPOSIÇÕES GERAIS: Este contrato é celebrado em caráter irrevogável e irretratável e obriga as partes, seus herdeiros e sucessores.
- CLÁUSULA 9ª – DO FORO: Fica eleito o foro da Comarca de **{foro}** para resolver qualquer questão referente a este contrato, com renúncia a qualquer outro, por mais privilegiado que seja.
- "E, por estarem de acordo, as partes assinam este contrato em 2 (duas) vias de igual teor e forma, na presença das 2 (duas) testemunhas abaixo."
- place/date; signature grid 2×2: VENDEDOR ({razão} / CNPJ) | COMPRADOR ({nome} / CPF-CNPJ) ; Testemunha 1 (Nome / CPF) | Testemunha 2.
EN uses SELLER/BUYER, FR VENDEUR/ACHETEUR; translate clause headings ("CLAUSE 1 – SUBJECT", "CLAUSE 1 – OBJET"…). Keep "R$" and Brazilian law references (EN: "Brazilian Consumer Protection Code", FR: "Code brésilien de défense du consommateur").

#### Recibo (prefix R)
Form: meta; pagador (nome + CPF/CNPJ, with saved-client select); valor; referente a (textarea); forma de pagamento chips [Dinheiro | PIX | Transferência bancária | Cartão | Boleto | Cheque].
Document: header; big "RECIBO  Nº R-2026-001" + boxed "R$ 1.200,00"; "Recebi de **{nome}**, CPF/CNPJ {doc}, a importância de **R$ {valor} ({extenso})**, referente a {ref}." "Forma de pagamento: {forma}." "Para maior clareza, firmo o presente recibo, dando plena quitação do valor recebido." place/date; one signature: {responsável} — {razão social} — CNPJ {cnpj}.

### Amount in words (implement carefully + unit-test in node)
`extenso(value, lang)` for BRL: PT "mil e duzentos reais", "um real", "dois mil, trezentos e quarenta e cinco reais e sessenta centavos" (simple acceptable: "dois mil trezentos e quarenta e cinco reais e sessenta centavos"), "cem reais", "cento e um reais", "um milhão de reais", "cinquenta centavos". Connector "e" before last group when it is <100 or a multiple of 100 (1.200 → "mil e duzentos"; 1.005 → "mil e cinco"; 1.250 → "mil duzentos e cinquenta"). EN: "one thousand two hundred reais", "one real", "and sixty centavos". FR: correct French rules (vingt et un, soixante et onze, quatre-vingts, quatre-vingt-un, deux cents / deux cent un, mille, deux mille, un million de reais), currency "reais"/"réal" singular, "centavos". Test: 0.5, 1, 2, 21, 71, 80, 81, 99, 100, 101, 200, 201, 1000, 1005, 1200, 1250, 2345.60, 1000000, 2500000.

### #clientes
List of saved clients (big cards: name, city, phone) with Editar / Apagar (inline confirm). "Adicionar cliente" opens same client fields form inline. Empty state explains: "Nenhum cliente salvo ainda. Ao preencher um documento, toque em 'Salvar este cliente'."

### #dados (company data, used in every document)
Fields with defaults: Razão social "Valdir de Paula Bicudo ME"; Seu nome completo "Valdir de Paula Bicudo"; CNPJ "21.914.770/0001-10"; Inscrição estadual "Isento"; Endereço "Rua São Marcos, 126 – Jardim São José"; Cidade – UF "Jacareí – SP"; CEP "12327-668"; Segundo endereço (opcional, empty); WhatsApp "(12) 99788-1836"; E-mail "4Vmanutencoes@gmail.com"; Cidade padrão dos documentos "Jacareí"; Foro padrão "Jacareí – SP"; checkbox "Mostrar endereço no topo dos documentos" (default off). Save button + "Dados salvos." status. Lead text: "Estes dados saem no topo e nas assinaturas de todos os documentos. Confira se estão certos."

## Implementation notes
- Build document from a block model so HTML preview, PDF, DOCX and plain text share one source: blocks like `{t:'title'}`, `{t:'meta'}`, `{t:'h'}`, `{t:'p', text}` (text supports `**bold**`; escape user input for HTML), `{t:'kv', rows}`, `{t:'table', head, rows}`, `{t:'ol'|'ul', items}`, `{t:'place'}`, `{t:'sign', cols}`, plus the header from company data.
- PDF: clone paper into an offscreen 794px container (not transformed), `html2pdf().set({margin:[10,0,12,0] /*paper has own padding*/, filename, image:{type:'jpeg',quality:0.95}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'mm',format:'a4'}, pagebreak:{mode:['css','legacy'], avoid:['tr','li','p','.sig','.d-h','.d-head']}}).from(el).outputPdf('blob')` → downloads.save.
- DOCX: build with docx lib from the same blocks (Paragraph/TextRun with bold runs, Table for kv/table/sign, ImageRun for logo from data URI → Uint8Array; page A4, margins ~2cm, font "Arial" 11pt) → `docx.Packer.toBlob(doc)` → downloads.save filename .docx.
- Plain text: join blocks as readable text (for WhatsApp).
- Keep JS organized, vanilla, no frameworks. Re-render the form only on view change or language change (preserve values from state); update the preview on input.

## Testing (required before you finish)
1. `node` unit test of extenso for all three languages (print results; fix errors).
2. Playwright (Chromium preinstalled at /opt/pw-browsers; do NOT run playwright install; use python playwright or node — check what's available) serving the scratchpad dir over a local http server; replace jsdelivr URLs with local lib paths ONLY in a test copy. Screenshot at 390×844 (light + dark color scheme): #inicio, #site, #garantia (filled with sample data), #contrato preview. Check no horizontal scroll (document.documentElement.scrollWidth <= innerWidth) on every view, no console errors.
3. In the test page, stub `window.claude = {use: async (n)=> n==='downloads' ? {save: async ({filename,data})=>{window.__saved={filename,size:data.size||data.length}; return {status:'saved'}}} : null}` and click Baixar PDF and Baixar Word on #contrato; confirm a non-empty blob was "saved" for each. Save the generated PDF to `build/test.pdf` (pass blob back via base64) and rasterize page 1 with `pdftoppm -r 60` to `build/test-pdf-1.png`.
4. Switch to EN and FR, screenshot #garantia preview once each.
Save screenshots in `build/shots/`. Report: file size, test results, any open issues. Keep your final report under 250 words.
