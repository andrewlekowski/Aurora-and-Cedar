import { CO_DEF, presetOrient } from '../src/index.js';

export const CO = { ...CO_DEF };

const cli = {
  cli_name: 'Clínica Exemplo Ltda', cli_ac: 'Dra. Ana Souza — Esterilização', cli_doc: '12.345.678/0001-90',
  cli_addr: 'Rua das Flores, 100 – Centro', cli_city: 'São José dos Campos – SP', cli_cep: '12200-000',
  cli_phone: '(12) 3333-4444', cli_email: 'contato@exemplo.com.br',
};

export const FULL = {
  garantia: {
    num: 'G-2026-007', date: '2026-10-02', city: 'Jacareí', ...cli,
    tipo: 'autoclave', equip: 'Autoclave 21 litros', brand: 'Sercon', model: 'AHMC-21', serial: 'SN12345', volt: '220',
    svc_date: '2026-09-30', svc_desc: 'Troca da borracha de vedação e da válvula de segurança.',
    parts: [{ qty: '1', name: 'Borracha de vedação' }, { qty: '1', name: 'Válvula de segurança' }],
    prazo: '6', prazo_other: '', g_start: '2026-10-01', notes: 'Equipamento testado com 3 ciclos completos.',
  },
  entrega: {
    num: 'E-2026-003', date: '2026-10-02', city: 'Jacareí', ...cli,
    tipo: 'autoclave', equip: 'Autoclave 21 litros', brand: 'Sercon', model: 'AHMC-21', serial: 'SN12345', volt: 'bi',
    orient: [...presetOrient('autoclave').map((o, i) => (i === 1 ? { ...o, on: false } : o)), { key: null, text: 'Guarde este termo junto ao manual.', on: true }],
    incl_g: true, prazo: '12', prazo_other: '', notes: '',
  },
  contrato: {
    num: 'C-2026-001', date: '2026-10-02', city: 'Jacareí', ...cli, cli_type: 'pj', cli_rep: 'Ana Souza, CPF 123.456.789-00',
    cli_rg: '', cli_nat: '',
    items: [{ desc: 'Autoclave Sercon 21 litros', serial: 'SN12345' }, { desc: 'Seladora Cristófoli', serial: 'CR-998' }],
    estado: 'usado', valor: '1.200,00', pay: 'pix', pay_other: '', pay_det: 'metade na assinatura e metade na entrega.',
    deliv_date: '2026-10-05', deliv_how: 'transp', prazo: 'other', prazo_other: '18 (dezoito) meses', foro: 'Jacareí – SP',
    wit1: 'João Silva, CPF 111.222.333-44', wit2: '',
  },
  recibo: {
    num: 'R-2026-010', date: '2026-10-02', city: 'Jacareí', cli_name: 'Clínica Exemplo Ltda', cli_doc: '12.345.678/0001-90',
    valor: '2345,60', ref: 'conserto de autoclave', rpay: 'pix',
  },
};

export const EMPTY = {
  garantia: { num: 'G-2026-001', date: '', city: '', tipo: 'autoclave', volt: '', parts: [{ qty: '', name: '' }], prazo: '3' },
  entrega: { num: 'E-2026-001', date: '', city: '', tipo: 'outro', volt: '', orient: [], incl_g: true, prazo: '3' },
  contrato: { num: 'C-2026-001', date: '', city: '', cli_type: 'pf', items: [{ desc: '', serial: '' }], valor: '', pay: 'avista', deliv_how: 'retira', prazo: '3', foro: '' },
  recibo: { num: 'R-2026-001', date: '', city: '', valor: '', ref: '', rpay: 'dinheiro' },
};
