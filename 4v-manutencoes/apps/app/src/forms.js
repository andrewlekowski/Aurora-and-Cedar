/* Form engine (schema → HTML, two-way binding). Ported from prototype/src/views.js. */
import { esc, orientText, presetText } from '@4v/docs-core';
import { app, t, $, $$ } from './state.js';
import { store } from './store.js';

export const CLI_BASIC=['cli_name','cli_ac','cli_doc','cli_addr','cli_city','cli_cep','cli_phone','cli_email'];
export const CLI_ALL=['cli_name','cli_ac','cli_doc','cli_addr','cli_city','cli_cep','cli_phone','cli_email','cli_type','cli_rg','cli_nat','cli_rep'];
export const CLI_KEYS={garantia:CLI_BASIC,entrega:CLI_BASIC,contrato:['cli_name','cli_doc','cli_addr','cli_city','cli_cep','cli_phone','cli_email','cli_type','cli_rg','cli_nat','cli_rep'],recibo:['cli_name','cli_doc']};
export const X=(k,o)=>Object.assign({k,type:'text'},o||{});
export const PRAZO_OPTS=[['3','prazo_3'],['6','prazo_6'],['12','prazo_12'],['other','prazo_other']];
export const prazoFields=(vis)=>[
  X('prazo',{type:'chips',opts:PRAZO_OPTS,show:vis}),
  X('prazo_other',{ph:'ph_prazo_other',show:S=>(!vis||vis(S))&&S.prazo==='other'})];
export const CLIENT_FLD={
  cli_name:X('cli_name'),cli_ac:X('cli_ac'),cli_doc:X('cli_doc'),cli_addr:X('cli_addr'),cli_city:X('cli_city'),
  cli_cep:X('cli_cep',{im:'numeric'}),cli_phone:X('cli_phone',{type:'tel'}),cli_email:X('cli_email',{type:'email'}),
  cli_type:X('cli_type',{type:'chips',opts:[['pf','type_pf'],['pj','type_pj']]}),
  cli_rg:X('cli_rg',{show:S=>S.cli_type!=='pj'}),cli_nat:X('cli_nat',{show:S=>S.cli_type!=='pj'}),cli_rep:X('cli_rep',{show:S=>S.cli_type==='pj'})};
export const META=[X('num'),X('date',{type:'date'}),X('city')];
export const EQUIP=[
  X('tipo',{type:'select',opts:['autoclave','odonto','estufa','exaustao','bio','outro'].map(v=>[v,'tipo_'+v])}),
  X('equip',{ph:'ph_equip'}),X('brand'),X('model'),X('serial'),
  X('volt',{type:'chips',opts:[['127',null,'127 V'],['220',null,'220 V'],['bi','volt_bi']]})];
export const clientFields=(type)=>[{type:'clitools',k:'_clitools'}].concat(CLI_KEYS[type].map(k=>{
  const f=Object.assign({},CLIENT_FLD[k]);
  if(type==='recibo'&&k==='cli_name')f.lk='f_pay_name';
  if(type==='contrato'&&k==='cli_type')f.lk='f_cli_type';
  return f;}));
export const SCHEMA={
 garantia:[
  {title:'s_meta',fields:META},
  {title:'s_client',fields:clientFields('garantia')},
  {title:'s_equip',fields:EQUIP},
  {title:'s_service',fields:[X('svc_date',{type:'date'}),X('svc_desc',{type:'textarea',rows:3}),
    {k:'parts',type:'rows',lk:'f_parts',cols:[{c:'qty',lk:'f_qty',im:'numeric'},{c:'name',lk:'f_part'}],two:1,add:'add_part',blank:{qty:'',name:''}}]},
  {title:'s_warranty',fields:prazoFields().concat([X('g_start',{type:'date',val:S=>S.g_start||S.date}),X('notes',{type:'textarea',rows:3})])}],
 entrega:[
  {title:'s_meta',fields:META},
  {title:'s_client',fields:clientFields('entrega')},
  {title:'s_equip',fields:EQUIP},
  {title:'s_orient',fields:[{k:'orient',type:'orient',lk:'f_orient'}]},
  {title:'s_warranty',fields:[X('incl_g',{type:'check'})].concat(prazoFields(S=>S.incl_g!==false),[X('notes',{type:'textarea',rows:3})])}],
 contrato:[
  {title:'s_meta',fields:META},
  {title:'s_buyer',fields:clientFields('contrato')},
  {title:'s_items',fields:[{k:'items',type:'rows',lk:'f_items',cols:[{c:'desc',lk:'f_item_desc'},{c:'serial',lk:'f_item_serial'}],add:'add_item',blank:{desc:'',serial:''}},
    X('estado',{type:'chips',opts:[['usado','est_usado'],['novo','est_novo'],['recond','est_recond']]})]},
  {title:'s_price',fields:[X('valor',{type:'text',im:'decimal',ph:'ph_valor'}),X('extenso',{type:'extenso',lk:'f_extenso'}),
    X('pay',{type:'chips',opts:[['avista','pay_avista'],['pix','pay_pix'],['parc','pay_parc'],['other','pay_other']]}),
    X('pay_other',{show:S=>S.pay==='other'}),X('pay_det')]},
  {title:'s_delivery',fields:[X('deliv_date',{type:'date'}),X('deliv_how',{type:'chips',opts:[['retira','dh_retira'],['transp','dh_transp'],['vend','dh_vend']]})]},
  {title:'s_warranty',fields:prazoFields()},
  {title:'s_foro',fields:[X('foro'),X('wit1'),X('wit2')]}],
 recibo:[
  {title:'s_meta',fields:META},
  {title:'s_payer',fields:clientFields('recibo')},
  {title:'s_receipt',fields:[X('valor',{im:'decimal',ph:'ph_valor'}),X('extenso',{type:'extenso',lk:'f_extenso'}),X('ref',{type:'textarea',rows:2,ph:'ph_ref'}),
    X('rpay',{type:'chips',opts:['dinheiro','pix','transf','cartao','boleto','cheque'].map(v=>[v,'rp_'+v]),lk:'f_rpay'})]}]
};
export const TITLE_KEY={garantia:'tile_g_t',entrega:'tile_e_t',contrato:'tile_c_t',recibo:'tile_r_t'};
export const label=f=>t(f.lk||('f_'+f.k));
export function fieldHTML(f,S,ns){
  ns=ns||'';
  const id='f-'+ns+f.k;
  const wrap=(inner)=>'<div class="fld" data-f="'+f.k+'">'+inner+'</div>';
  const ph=f.ph?' placeholder="'+esc(t(f.ph))+'"':'';
  const val=f.val?f.val(S):S[f.k];
  switch(f.type){
    case 'text':case 'tel':case 'email':
      return wrap('<label for="'+id+'">'+esc(label(f))+'</label><input id="'+id+'" data-k="'+f.k+'" type="'+(f.type==='tel'?'tel':f.type==='email'?'email':'text')+'" value="'+esc(val)+'"'+ph+(f.im?' inputmode="'+f.im+'"':'')+' autocomplete="off" autocapitalize="sentences">');
    case 'date':return wrap('<label for="'+id+'">'+esc(label(f))+'</label><input id="'+id+'" data-k="'+f.k+'" type="date" value="'+esc(val)+'">');
    case 'textarea':return wrap('<label for="'+id+'">'+esc(label(f))+'</label><textarea id="'+id+'" data-k="'+f.k+'" rows="'+(f.rows||3)+'"'+ph+'>'+esc(val)+'</textarea>');
    case 'select':return wrap('<label for="'+id+'">'+esc(label(f))+'</label><select id="'+id+'" data-k="'+f.k+'">'+f.opts.map(o=>'<option value="'+o[0]+'"'+(String(val)===o[0]?' selected':'')+'>'+esc(o[1]?t(o[1]):o[2])+'</option>').join('')+'</select>');
    case 'chips':return wrap('<div class="lbl" id="l-'+ns+f.k+'">'+esc(label(f))+'</div><div class="chips" role="radiogroup" aria-labelledby="l-'+ns+f.k+'">'+f.opts.map((o,i)=>'<label class="chip"><input type="radio" id="'+id+'-'+i+'" name="r-'+ns+f.k+'" data-k="'+f.k+'" value="'+o[0]+'"'+(String(val)===o[0]?' checked':'')+'><span>'+esc(o[1]?t(o[1]):o[2])+'</span></label>').join('')+'</div>');
    case 'check':return wrap('<label class="chk" for="'+id+'"><input type="checkbox" id="'+id+'" data-k="'+f.k+'"'+(val!==false&&val!==''&&val!==undefined?' checked':'')+'><span>'+esc(label(f))+'</span></label>');
    case 'extenso':return wrap('<div class="lbl">'+esc(label(f))+'</div><div class="extenso" id="f-extenso" aria-live="polite"></div>');
    case 'rows':{
      const rows=S[f.k]||[];
      return wrap('<div class="lbl">'+esc(label(f))+'</div>'+rows.map((r,i)=>'<div class="sub"><div class="'+(f.two?'two':'')+'" style="display:grid;gap:10px">'+f.cols.map(c=>'<div><label for="f-'+f.k+'-'+i+'-'+c.c+'">'+esc(t(c.lk))+'</label><input type="text" id="f-'+f.k+'-'+i+'-'+c.c+'" data-r="'+f.k+'" data-i="'+i+'" data-c="'+c.c+'" value="'+esc(r[c.c])+'"'+(c.im?' inputmode="'+c.im+'"':'')+' autocomplete="off"></div>').join('')+'</div><button type="button" class="btn small" data-act="rm-row" data-r="'+f.k+'" data-i="'+i+'">'+esc(t('remove'))+'</button></div>').join('')+'<button type="button" class="btn" data-act="add-row" data-r="'+f.k+'">+ '+esc(t(f.add))+'</button>');
    }
    case 'orient':{
      const items=S.orient||[];
      return wrap('<div class="lbl">'+esc(label(f))+'</div><p class="muted" style="margin:0 0 12px;font-size:17px">'+esc(t('orient_hint'))+'</p><div id="tipo-confirm"></div>'+items.map((it,i)=>'<div class="orient"><label class="chk" for="f-orient-on-'+i+'"><input type="checkbox" id="f-orient-on-'+i+'" data-o="on" data-i="'+i+'"'+(it.on?' checked':'')+' aria-label="'+esc(t('orient_on'))+'"></label><textarea id="f-orient-'+i+'" data-o="text" data-i="'+i+'" rows="2" aria-label="'+esc(t('f_orient')+' '+(i+1))+'">'+esc(orientText(it,app.lang,app.CO))+'</textarea>'+(it.key?'':'<button type="button" class="btn small rm" data-act="rm-orient" data-i="'+i+'">'+esc(t('remove'))+'</button>')+'</div>').join('')+'<button type="button" class="btn" data-act="add-orient">+ '+esc(t('add_orient'))+'</button>');
    }
    case 'clitools':{
      const cl=store.get('clients',[]);
      return '<div class="cli-tools" data-f="_clitools">'+(cl.length?'<div class="fld"><label for="cli-select">'+esc(t('cli_saved'))+'</label><select id="cli-select"><option value="">'+esc(t('cli_saved_ph'))+'</option>'+cl.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.cli_name||'—')+'</option>').join('')+'</select></div>':'')+'<button type="button" class="btn" data-act="save-client">'+esc(t('cli_save'))+'</button><div class="status" id="cli-status" role="status" aria-live="polite"></div></div>';
    }
  }
  return '';
}
export const sectionsHTML=(sections,S)=>sections.map((sec,i)=>'<section class="card"><h2><span class="n">'+(i+1)+'</span><span>'+esc(t(sec.title))+'</span></h2>'+sec.fields.map(f=>fieldHTML(f,S)).join('')+'</section>').join('');
export function applyVis(root,fields,S){
  fields.forEach(f=>{if(f.show){const el=root.querySelector('[data-f="'+f.k+'"]');if(el)el.hidden=!f.show(S);}});
}
export function autoGrow(el){el.style.height='auto';el.style.height=(el.scrollHeight+4)+'px';}
export function growAll(root){$$('textarea',root).forEach(autoGrow);}
export function attachForm(root,S,hooks){
  const upd=e=>{
    const el=e.target;if(!el||!el.dataset)return;
    if(el.dataset.r){const row=S[el.dataset.r][+el.dataset.i];if(row&&row[el.dataset.c]!==el.value){row[el.dataset.c]=el.value;hooks.changed(el.dataset.r,el);}return;}
    if(el.dataset.o){
      const it=S.orient[+el.dataset.i];if(!it)return;
      if(el.dataset.o==='on'){it.on=el.checked;}
      else{autoGrow(el);it.text=(it.key&&el.value===presetText(it.key,app.lang,app.CO))?null:el.value;}
      hooks.changed('orient',el);return;
    }
    const k=el.dataset.k;if(!k)return;
    if(el.tagName==='TEXTAREA')autoGrow(el);
    const v=el.type==='checkbox'?el.checked:el.value;
    if(S[k]===v)return;
    if(hooks.before&&hooks.before(k,v,el)===false)return;
    const old=S[k];S[k]=v;hooks.changed(k,el,old);
  };
  root.addEventListener('input',upd);root.addEventListener('change',upd);
  root.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&root.contains(b)&&hooks.act)hooks.act(b.dataset.act,b,e);});
}
export function showConfirm(slot,msg,onYes,onNo){
  slot.innerHTML='<div class="confirm" role="alertdialog" aria-label="'+esc(msg)+'"><p>'+esc(msg)+'</p><div class="row"><button type="button" class="btn primary" data-c="y">'+esc(t('yes'))+'</button><button type="button" class="btn" data-c="n">'+esc(t('no'))+'</button></div></div>';
  const y=$('[data-c=y]',slot),n=$('[data-c=n]',slot);
  y.onclick=()=>{slot.innerHTML='';onYes();};
  n.onclick=()=>{slot.innerHTML='';if(onNo)onNo();};
  n.focus();
}
export const backBtn=()=>'<a class="btn back" href="/">'+esc(t('back'))+'</a>';
