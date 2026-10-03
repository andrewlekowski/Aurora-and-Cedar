/* ================= form engine ================= */
const CLI_BASIC=['cli_name','cli_ac','cli_doc','cli_addr','cli_city','cli_cep','cli_phone','cli_email'];
const CLI_ALL=['cli_name','cli_ac','cli_doc','cli_addr','cli_city','cli_cep','cli_phone','cli_email','cli_type','cli_rg','cli_nat','cli_rep'];
const CLI_KEYS={garantia:CLI_BASIC,entrega:CLI_BASIC,contrato:['cli_name','cli_doc','cli_addr','cli_city','cli_cep','cli_phone','cli_email','cli_type','cli_rg','cli_nat','cli_rep'],recibo:['cli_name','cli_doc']};
const X=(k,o)=>Object.assign({k,type:'text'},o||{});
const PRAZO_OPTS=[['3','prazo_3'],['6','prazo_6'],['12','prazo_12'],['other','prazo_other']];
const prazoFields=(vis)=>[
  X('prazo',{type:'chips',opts:PRAZO_OPTS,show:vis}),
  X('prazo_other',{ph:'ph_prazo_other',show:S=>(!vis||vis(S))&&S.prazo==='other'})];
const CLIENT_FLD={
  cli_name:X('cli_name'),cli_ac:X('cli_ac'),cli_doc:X('cli_doc'),cli_addr:X('cli_addr'),cli_city:X('cli_city'),
  cli_cep:X('cli_cep',{im:'numeric'}),cli_phone:X('cli_phone',{type:'tel'}),cli_email:X('cli_email',{type:'email'}),
  cli_type:X('cli_type',{type:'chips',opts:[['pf','type_pf'],['pj','type_pj']]}),
  cli_rg:X('cli_rg',{show:S=>S.cli_type!=='pj'}),cli_nat:X('cli_nat',{show:S=>S.cli_type!=='pj'}),cli_rep:X('cli_rep',{show:S=>S.cli_type==='pj'})};
const META=[X('num'),X('date',{type:'date'}),X('city')];
const EQUIP=[
  X('tipo',{type:'select',opts:['autoclave','odonto','estufa','exaustao','bio','outro'].map(v=>[v,'tipo_'+v])}),
  X('equip',{ph:'ph_equip'}),X('brand'),X('model'),X('serial'),
  X('volt',{type:'chips',opts:[['127',null,'127 V'],['220',null,'220 V'],['bi','volt_bi']]})];
const clientFields=(type)=>[{type:'clitools',k:'_clitools'}].concat(CLI_KEYS[type].map(k=>{
  const f=Object.assign({},CLIENT_FLD[k]);
  if(type==='recibo'&&k==='cli_name')f.lk='f_pay_name';
  if(type==='contrato'&&k==='cli_type')f.lk='f_cli_type';
  return f;}));
const SCHEMA={
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
const TITLE_KEY={garantia:'tile_g_t',entrega:'tile_e_t',contrato:'tile_c_t',recibo:'tile_r_t'};
const label=f=>t(f.lk||('f_'+f.k));
function fieldHTML(f,S,ns){
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
      return wrap('<div class="lbl">'+esc(label(f))+'</div><p class="muted" style="margin:0 0 12px;font-size:17px">'+esc(t('orient_hint'))+'</p><div id="tipo-confirm"></div>'+items.map((it,i)=>'<div class="orient"><label class="chk" for="f-orient-on-'+i+'"><input type="checkbox" id="f-orient-on-'+i+'" data-o="on" data-i="'+i+'"'+(it.on?' checked':'')+' aria-label="'+esc(t('orient_on'))+'"></label><textarea id="f-orient-'+i+'" data-o="text" data-i="'+i+'" rows="2" aria-label="'+esc(t('f_orient')+' '+(i+1))+'">'+esc(orientText(it,LANG))+'</textarea>'+(it.key?'':'<button type="button" class="btn small rm" data-act="rm-orient" data-i="'+i+'">'+esc(t('remove'))+'</button>')+'</div>').join('')+'<button type="button" class="btn" data-act="add-orient">+ '+esc(t('add_orient'))+'</button>');
    }
    case 'clitools':{
      const cl=store.get('clients',[]);
      return '<div class="cli-tools" data-f="_clitools">'+(cl.length?'<div class="fld"><label for="cli-select">'+esc(t('cli_saved'))+'</label><select id="cli-select"><option value="">'+esc(t('cli_saved_ph'))+'</option>'+cl.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.cli_name||'—')+'</option>').join('')+'</select></div>':'')+'<button type="button" class="btn" data-act="save-client">'+esc(t('cli_save'))+'</button><div class="status" id="cli-status" role="status" aria-live="polite"></div></div>';
    }
  }
  return '';
}
const sectionsHTML=(sections,S)=>sections.map((sec,i)=>'<section class="card"><h2><span class="n">'+(i+1)+'</span><span>'+esc(t(sec.title))+'</span></h2>'+sec.fields.map(f=>fieldHTML(f,S)).join('')+'</section>').join('');
function applyVis(root,fields,S){
  fields.forEach(f=>{if(f.show){const el=root.querySelector('[data-f="'+f.k+'"]');if(el)el.hidden=!f.show(S);}});
}
function autoGrow(el){el.style.height='auto';el.style.height=(el.scrollHeight+4)+'px';}
function growAll(root){$$('textarea',root).forEach(autoGrow);}
function attachForm(root,S,hooks){
  const upd=e=>{
    const el=e.target;if(!el||!el.dataset)return;
    if(el.dataset.r){const row=S[el.dataset.r][+el.dataset.i];if(row&&row[el.dataset.c]!==el.value){row[el.dataset.c]=el.value;hooks.changed(el.dataset.r,el);}return;}
    if(el.dataset.o){
      const it=S.orient[+el.dataset.i];if(!it)return;
      if(el.dataset.o==='on'){it.on=el.checked;}
      else{autoGrow(el);it.text=(it.key&&el.value===presetText(it.key,LANG))?null:el.value;}
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
function showConfirm(slot,msg,onYes,onNo){
  slot.innerHTML='<div class="confirm" role="alertdialog" aria-label="'+esc(msg)+'"><p>'+esc(msg)+'</p><div class="row"><button type="button" class="btn primary" data-c="y">'+esc(t('yes'))+'</button><button type="button" class="btn" data-c="n">'+esc(t('no'))+'</button></div></div>';
  const y=$('[data-c=y]',slot),n=$('[data-c=n]',slot);
  y.onclick=()=>{slot.innerHTML='';onYes();};
  n.onclick=()=>{slot.innerHTML='';if(onNo)onNo();};
  n.focus();
}
const backBtn=()=>'<a class="btn back" href="#inicio">'+esc(t('back'))+'</a>';
/* ================= document editor ================= */
let cur=null,prevTimer=null;
function baseDefaults(type){
  const today=todayISO();
  const S={date:today,city:CO.cidpad||'',cli_name:'',cli_ac:'',cli_doc:'',cli_addr:'',cli_city:'',cli_cep:'',cli_phone:'',cli_email:'',cli_type:'pf',cli_rg:'',cli_nat:'',cli_rep:'',notes:''};
  if(type==='garantia'||type==='entrega'){Object.assign(S,{tipo:'autoclave',equip:'',brand:'',model:'',serial:'',volt:'',prazo:'3',prazo_other:''});}
  if(type==='garantia')Object.assign(S,{svc_date:today,svc_desc:'',parts:[{qty:'',name:''}],g_start:''});
  if(type==='entrega')Object.assign(S,{orient:presetOrient('autoclave'),incl_g:true});
  if(type==='contrato')Object.assign(S,{items:[{desc:'',serial:''}],estado:'usado',valor:'',pay:'avista',pay_other:'',pay_det:'',deliv_date:today,deliv_how:'retira',prazo:'3',prazo_other:'',foro:CO.foro||'',wit1:'',wit2:''});
  if(type==='recibo')Object.assign(S,{valor:'',ref:'',rpay:'dinheiro'});
  return S;
}
function nextNum(type){
  const p=PFX[type],y=new Date().getFullYear(),key='cnt_'+p+'_'+y;
  const n=(parseInt(store.get(key,0),10)||0)+1;store.set(key,n);
  return p+'-'+y+'-'+String(n).padStart(3,'0');
}
function loadState(type){
  const saved=store.get('draft_'+type,null);
  let S=baseDefaults(type);
  if(saved&&typeof saved==='object'&&saved.num)Object.assign(S,saved);
  else{S.num=nextNum(type);}
  store.set('draft_'+type,S);
  return S;
}
function saveDraft(){store.set('draft_'+cur.type,cur.S);}
function updateDerived(){
  const el=$('#f-extenso');
  if(el){const v=parseMoney(cur.S.valor);el.textContent=isNaN(v)?t('extenso_empty'):extenso(v,LANG);el.style.color=isNaN(v)?'var(--muted)':'';}
}
function schedulePreview(){clearTimeout(prevTimer);prevTimer=setTimeout(renderPreview,150);}
function renderPreview(){
  if(!cur)return;
  cur.blocks=buildBlocks(cur.type,cur.S,LANG);
  const sizer=$('#paper-sizer');if(!sizer)return;
  sizer.innerHTML=blocksHTML(cur.blocks,LANG);
  fitPaper();
}
function fitPaper(){
  const w=$('#paper-wrap'),sizer=$('#paper-sizer');
  if(!w||!sizer||!sizer.firstElementChild)return;
  const paper=sizer.firstElementChild;
  const avail=w.clientWidth||320;
  const fit=Math.min(1,avail/794);
  const s=cur&&cur.zoom?Math.min(1,fit*2.2):fit;
  paper.style.transform='scale('+s+')';
  sizer.style.width=Math.round(794*s)+'px';
  sizer.style.height=Math.ceil(paper.offsetHeight*s)+'px';
}
function setStatus(msg,kind){
  $$('.st-line').forEach(el=>{el.textContent=msg||'';el.className='status st-line'+(kind?' '+kind:'');});
}
async function makePdf(){
  await loadScript(URL_H2P,'html2pdf');
  try{if(document.fonts&&document.fonts.ready)await document.fonts.ready;}catch(e){}
  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:-10000px;top:0;width:794px;background:#fff';
  host.innerHTML=blocksHTML(cur.blocks,LANG).replace('class="paper"','class="paper pdf"');
  document.body.appendChild(host);
  try{
    return await html2pdf().set({margin:[10,0,12,0],image:{type:'jpeg',quality:0.95},html2canvas:{scale:2,useCORS:true,windowWidth:794,scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['tr','li','p','.d-sign','.d-h','.d-ch','.d-head']}}).from(host.firstElementChild).outputPdf('blob');
  }finally{host.remove();}
}
let busy=false;
async function doExport(kind){
  if(busy||!cur)return;
  busy=true;$$('[data-export]').forEach(b=>b.disabled=true);
  setStatus(t('st_prep'));
  try{
    clearTimeout(prevTimer);renderPreview();
    const name=docFilename(cur.type,cur.S,LANG,kind==='pdf'?'pdf':'docx');
    let blob;
    if(kind==='pdf')blob=await makePdf();
    else{await loadScript(URL_DOCX,'docx');blob=await docx.Packer.toBlob(buildDocx(cur.blocks,LANG));}
    if(window.__testBlob)window.__testBlob(kind,blob);
    const r=await saveFile(name,blob);
    if(r==='saved')setStatus(t('st_ready'),'ok');
    else if(r==='cancelled')setStatus(t('st_cancel'));
    else setStatus(t('st_unavail'),'err');
  }catch(e){
    console.error('export failed',e);
    setStatus(t('st_err'),'err');
  }finally{busy=false;$$('[data-export]').forEach(b=>b.disabled=false);}
}
async function doCopyDoc(){
  renderPreview();
  const txt=blocksText(cur.blocks,LANG);
  const box=$('#copybox');
  box.value=txt;
  const r=await copyText(txt,null);
  if(r==='copied'){box.hidden=true;setStatus(t('st_copied'),'ok');}
  else{box.hidden=false;box.focus();box.select();setStatus(t('st_sel'));}
}
function viewDoc(app,type){
  const sections=SCHEMA[type];
  const fieldsAll=[].concat(...sections.map(s=>s.fields));
  cur={type,S:loadState(type),zoom:false,blocks:[]};
  const S=cur.S;
  app.innerHTML=backBtn()+'<h1 class="h1" style="margin-bottom:14px">'+esc(t(TITLE_KEY[type]))+'</h1>'
   +'<p class="tip">'+esc(t('tip'))+'</p>'
   +'<div id="newdoc-slot"></div><button type="button" class="btn small" id="newdoc-btn" style="margin-bottom:20px">'+esc(t('newdoc'))+'</button>'
   +'<div class="editor"><div class="form-col" id="form-col"></div>'
   +'<aside class="prev-col" id="preview" aria-label="'+esc(t('prev_t'))+'"><h2 class="h2">'+esc(t('prev_t'))+'</h2>'
   +'<div class="btns"><button type="button" class="btn primary" data-export="pdf" id="btn-pdf">'+esc(t('dl_pdf'))+'</button><button type="button" class="btn" data-export="docx" id="btn-docx">'+esc(t('dl_docx'))+'</button><button type="button" class="btn" id="btn-copy">'+esc(t('copy_txt'))+'</button></div>'
   +'<div class="status st-line" role="status" aria-live="polite"></div><textarea id="copybox" class="copybox" rows="8" readonly hidden aria-label="'+esc(t('copy_txt'))+'" style="overflow:auto"></textarea>'
   +'<button type="button" class="btn small" id="btn-zoom">'+esc(t('zoom_in'))+'</button>'
   +'<div class="paper-wrap" id="paper-wrap"><div class="paper-sizer" id="paper-sizer"></div></div></aside></div>'
   +'<div class="bar"><div class="status st-line" role="status" aria-live="polite"></div><button type="button" class="btn" id="bar-see">'+esc(t('see_doc'))+'</button><button type="button" class="btn primary" data-export="pdf" id="bar-pdf">'+esc(t('dl_pdf'))+'</button></div>';
  const fc=$('#form-col');
  const draw=()=>{
    fc.innerHTML=sectionsHTML(sections,S);
    applyVis(fc,fieldsAll,S);growAll(fc);updateDerived();
  };
  draw();renderPreview();
  const afterChange=()=>{applyVis(fc,fieldsAll,S);updateDerived();saveDraft();schedulePreview();};
  let pendingTipo=null;
  attachForm(fc,S,{
    before(k,v,el){
      if(type==='entrega'&&k==='tipo'){
        const edited=S.orient.some(o=>o.text!==null||!o.key);
        if(edited){
          pendingTipo=v;el.value=S.tipo;
          showConfirm($('#tipo-confirm',fc),t('confirm_tipo'),()=>{
            const old=S.tipo;S.tipo=pendingTipo;S.orient=presetOrient(S.tipo);equipPrefill(old);draw();afterChange();
          });
          return false;
        }
      }
      return true;
    },
    changed(k,el,old){
      if(k==='tipo'){
        equipPrefill(old);
        if(type==='entrega'){S.orient=presetOrient(S.tipo);draw();}
        else{const e=$('#f-equip',fc);if(e)e.value=S.equip;}
      }
      if(k==='cli_type'||k==='prazo'||k==='pay'||k==='incl_g'){applyVis(fc,fieldsAll,S);}
      afterChange();
    },
    act(a,b){
      if(a==='add-row'){const f=fieldsAll.find(x=>x.k===b.dataset.r);S[f.k].push(Object.assign({},f.blank));draw();saveDraft();schedulePreview();const n=S[f.k].length-1;const first=$('#f-'+f.k+'-'+n+'-'+f.cols[0].c,fc);if(first)first.focus();}
      else if(a==='rm-row'){const f=fieldsAll.find(x=>x.k===b.dataset.r);S[f.k].splice(+b.dataset.i,1);if(!S[f.k].length)S[f.k].push(Object.assign({},f.blank));draw();saveDraft();schedulePreview();}
      else if(a==='add-orient'){S.orient.push({key:null,text:'',on:true});draw();saveDraft();schedulePreview();const el=$('#f-orient-'+(S.orient.length-1),fc);if(el)el.focus();}
      else if(a==='rm-orient'){S.orient.splice(+b.dataset.i,1);draw();saveDraft();schedulePreview();}
      else if(a==='save-client')saveClientFromDoc();
    }
  });
  function equipPrefill(old){
    const lbl=(l,tp)=>I18N[l]['tipo_'+tp];
    const wasLabel=['pt','en','fr'].some(l=>S.equip===lbl(l,old));
    if(!S.equip||wasLabel)S.equip=S.tipo==='outro'?'':lbl(LANG,S.tipo);
  }
  fc.addEventListener('change',e=>{
    if(e.target.id!=='cli-select'||!e.target.value)return;
    const c=store.get('clients',[]).find(x=>x.id===e.target.value);if(!c)return;
    CLI_KEYS[type].forEach(k=>{if(c[k]!==undefined)S[k]=c[k];});
    draw();afterChange();
  });
  function saveClientFromDoc(){
    const st=$('#cli-status',fc);
    if(!String(S.cli_name||'').trim()){st.textContent=t('cli_need_name');st.className='status err';return;}
    const list=store.get('clients',[]);
    const nm=S.cli_name.trim().toLowerCase();
    let c=list.find(x=>String(x.cli_name||'').trim().toLowerCase()===nm);
    if(!c){c={id:'c'+Date.now().toString(36)};CLI_ALL.forEach(k=>c[k]=k==='cli_type'?'pf':'');list.push(c);}
    CLI_KEYS[type].forEach(k=>c[k]=S[k]);
    store.set('clients',list);
    const sel=$('#cli-select',fc);
    if(sel){sel.innerHTML='<option value="">'+esc(t('cli_saved_ph'))+'</option>'+list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.cli_name||'—')+'</option>').join('');}
    else draw();
    const st2=$('#cli-status',fc);st2.textContent=t('cli_saved_ok');st2.className='status ok';
  }
  $('#newdoc-btn').onclick=()=>{
    showConfirm($('#newdoc-slot'),t('confirm_new'),()=>{
      store.del('draft_'+type);
      const ns=baseDefaults(type);ns.num=nextNum(type);
      Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,ns);
      store.set('draft_'+type,S);
      draw();renderPreview();setStatus('');window.scrollTo(0,0);
    });
  };
  $$('[data-export]').forEach(b=>b.onclick=()=>doExport(b.dataset.export));
  $('#btn-copy').onclick=doCopyDoc;
  $('#bar-see').onclick=()=>$('#preview').scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'});
  $('#btn-zoom').onclick=function(){cur.zoom=!cur.zoom;this.textContent=t(cur.zoom?'zoom_out':'zoom_in');fitPaper();};
}
/* ================= other views ================= */
function viewInicio(app){
  const h=new Date().getHours();
  const g=h>=5&&h<12?'greet_m':h>=12&&h<18?'greet_a':'greet_n';
  const tile=(href,tk,dk)=>'<a class="tile" href="#'+href+'"><span class="tt">'+esc(t(tk))+'</span>'+(dk?'<span class="td">'+esc(t(dk))+'</span>':'')+'</a>';
  app.innerHTML='<div class="hero-home"><img src="'+PHOTO+'" alt="Valdir Bicudo"><h1 class="h1">'+esc(t(g))+'</h1></div>'
   +'<h2 class="h2">'+esc(t('home_q'))+'</h2><div class="tiles">'
   +tile('garantia','tile_g_t','tile_g_d')+tile('entrega','tile_e_t','tile_e_d')+tile('contrato','tile_c_t','tile_c_d')+tile('recibo','tile_r_t','tile_r_d')+'</div>'
   +'<h2 class="h2">'+esc(t('how_t'))+'</h2><ol class="steps"><li>'+esc(t('how1'))+'</li><li>'+esc(t('how2'))+'</li><li>'+esc(t('how3'))+'</li></ol>'
   +'<h2 class="h2">'+esc(t('other_t'))+'</h2><div class="tiles small">'+tile('clientes','o_clients')+tile('dados','o_data')+tile('site','o_site')+'</div>'
   +'<p class="note">'+esc(t('saved_note'))+'</p>';
}
function sealSVG(){
  const s=t('seal');
  return '<svg class="seal" viewBox="0 0 220 220" role="img" aria-label="'+esc(s.join(' '))+'"><circle cx="110" cy="110" r="104" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round"/><circle cx="110" cy="110" r="92" fill="none" stroke="currentColor" stroke-width="3"/>'
   +'<text x="110" y="66" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-weight="800" font-size="11.5" letter-spacing=".8" fill="currentColor">'+esc(s[0])+'</text>'
   +'<text x="110" y="128" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-weight="800" font-size="72" fill="currentColor">'+esc(s[1])+'</text>'
   +'<text x="110" y="150" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-weight="800" font-size="19" letter-spacing="3" fill="currentColor">'+esc(s[2])+'</text>'
   +'<text x="110" y="170" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-weight="700" font-size="9" letter-spacing=".3" fill="currentColor">'+esc(s[3])+'</text></svg>';
}
function viewSite(app){
  const wa='https://wa.me/'+WA_NUM+'?text='+encodeURIComponent(t('wa_text'));
  const contact=(k,v,link)=>'<div class="c-item"><div><span class="k">'+esc(t(k))+'</span><span class="v">'+esc(v)+'</span></div>'+(link===false?'':'<button type="button" class="btn small" data-copy="'+esc(v)+'">'+esc(t('copy'))+'</button>')+'</div>';
  app.innerHTML='<section class="s-hero"><img class="wm" src="'+LOGO+'" alt="" aria-hidden="true"><div class="eyebrow">'+esc(t('sub'))+'</div><h1>'+esc(t('h1'))+'</h1><p class="lead">'+esc(t('lead'))+'</p>'
   +'<a class="btn primary" href="'+wa+'" target="_blank" rel="noopener">'+esc(t('wa_btn'))+'</a>'
   +'<div class="s-num"><span>'+esc(CO_DEF.whats)+'</span><button type="button" class="btn small" data-copy="'+esc(CO_DEF.whats)+'">'+esc(t('copy'))+'</button></div></section>'
   +'<div class="s-card"><img src="'+PHOTO+'" alt="Valdir Bicudo"><div><b>'+esc(t('card_t'))+'</b>'+esc(t('card_d'))+'</div></div>'
   +'<section class="sec"><h2>'+esc(t('sv_t'))+'</h2><ul class="svc">'+t('sv').map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="muted">'+esc(t('sv_areas'))+'</p></section>'
   +'<section class="sec"><h2>'+esc(t('exp_t'))+'</h2><div class="since"><span>'+esc(t('exp_since'))+'</span><b>2015</b></div><p class="lead">'+esc(t('exp_lead'))+'</p>'
   +'<h3 class="sub-h">'+esc(t('exp_uni_t'))+'</h3><p>'+esc(t('exp_uni_lead'))+'</p><ul class="uni">'+t('exp_uni').map(x=>'<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>').join('')+'</ul>'
   +'<h3 class="sub-h">'+esc(t('exp_eq_t'))+'</h3><ul class="eq">'+t('exp_eq').map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'
   +'<h3 class="sub-h">'+esc(t('exp_pub_t'))+'</h3><dl class="chrono">'+t('exp_pub').map(x=>'<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>').join('')+'</dl>'
   +'<p class="fact">'+esc(t('exp_prisma'))+'</p><p class="fact">'+esc(t('exp_inst'))+'</p></section>'
   +'<section class="sec"><h2>'+esc(t('gw_t'))+'</h2><div class="g-wrap">'+sealSVG()+'<ul>'+t('gw').map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></section>'
   +'<section class="sec"><h2>'+esc(t('hw_t'))+'</h2><ol class="steps">'+t('hw').map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></section>'
   +'<section class="sec"><h2>'+esc(t('ct_t'))+'</h2><div class="contact">'
   +contact('ct_wa',CO_DEF.whats)+contact('ct_mail',CO_DEF.email)+contact('ct_loc',t('loc'),false)+'</div></section>'
   +'<footer class="s-foot"><div>4V Manutencoes · CNPJ 21.914.770/0001-10</div><a href="#inicio">'+esc(t('foot_docs'))+'</a></footer>';
}
function viewClientes(app){
  let editing=null,confirmId=null;
  const fields=CLI_ALL.map(k=>{const f=Object.assign({},CLIENT_FLD[k]);if(k==='cli_type')f.lk='f_cli_type_c';return f;});
  const draw=()=>{
    const list=store.get('clients',[]);
    let h=backBtn()+'<h1 class="h1" style="margin-bottom:16px">'+esc(t('clients_t'))+'</h1>';
    if(editing){
      h+='<section class="card"><h2><span>'+esc(t('client_form_t'))+'</span></h2><div id="cf">'+fields.map(f=>fieldHTML(f,editing.data,'cl-')).join('')+'</div><div class="row" style="margin-top:16px"><button type="button" class="btn primary" data-act="cl-save">'+esc(t('save'))+'</button><button type="button" class="btn" data-act="cl-cancel">'+esc(t('cancel'))+'</button></div><div class="status" id="cl-status" role="status"></div></section>';
    }else{
      h+='<button type="button" class="btn primary" data-act="cl-add" style="margin-bottom:18px">+ '+esc(t('add_client'))+'</button>';
      if(!list.length)h+='<p class="lead">'+esc(t('clients_empty'))+'</p>';
      list.forEach(c=>{
        h+='<div class="cl"><b>'+esc(c.cli_name||'—')+'</b><span class="muted">'+esc([c.cli_city,c.cli_phone].filter(Boolean).join(' · '))+'</span>';
        if(confirmId===c.id)h+='<div class="confirm" role="alertdialog" style="margin-bottom:0"><p>'+esc(t('del_confirm'))+'</p><div class="row"><button type="button" class="btn primary" data-act="cl-del-yes" data-id="'+esc(c.id)+'">'+esc(t('yes'))+'</button><button type="button" class="btn" data-act="cl-del-no">'+esc(t('no'))+'</button></div></div>';
        else h+='<div class="row"><button type="button" class="btn small" data-act="cl-edit" data-id="'+esc(c.id)+'">'+esc(t('edit'))+'</button><button type="button" class="btn small" data-act="cl-del" data-id="'+esc(c.id)+'">'+esc(t('del'))+'</button></div>';
        h+='</div>';
      });
    }
    app.innerHTML=h;
    if(editing){
      const cf=$('#cf');applyVis(cf,fields,editing.data);
      attachForm(cf,editing.data,{changed(){applyVis(cf,fields,editing.data);}});
    }
  };
  app.addEventListener('click',e=>{
    const b=e.target.closest('[data-act]');if(!b)return;
    const a=b.dataset.act,list=store.get('clients',[]);
    if(a==='cl-add'){const d={};CLI_ALL.forEach(k=>d[k]=k==='cli_type'?'pf':'');editing={id:null,data:d};draw();}
    else if(a==='cl-edit'){const c=list.find(x=>x.id===b.dataset.id);if(c){editing={id:c.id,data:Object.assign({},c)};draw();}}
    else if(a==='cl-cancel'){editing=null;draw();}
    else if(a==='cl-save'){
      if(!String(editing.data.cli_name||'').trim()){const s=$('#cl-status');s.textContent=t('cli_need_name');s.className='status err';return;}
      if(editing.id){const i=list.findIndex(x=>x.id===editing.id);if(i>=0)list[i]=Object.assign({},editing.data,{id:editing.id});}
      else list.push(Object.assign({},editing.data,{id:'c'+Date.now().toString(36)}));
      store.set('clients',list);editing=null;draw();
    }
    else if(a==='cl-del'){confirmId=b.dataset.id;draw();}
    else if(a==='cl-del-no'){confirmId=null;draw();}
    else if(a==='cl-del-yes'){store.set('clients',list.filter(x=>x.id!==b.dataset.id));confirmId=null;draw();}
  });
  draw();
}
const CO_FIELDS=['razao','nome','cnpj','ie','end','cidade','cep','end2','whats','email','cidpad','foro','showaddr'];
function viewDados(app){
  const S={};CO_FIELDS.forEach(k=>S['co_'+k]=CO[k]);
  const fields=CO_FIELDS.map(k=>X('co_'+k,{lk:'co_'+k,type:k==='showaddr'?'check':k==='whats'?'tel':k==='email'?'email':'text',im:k==='cep'?'numeric':undefined}));
  app.innerHTML=backBtn()+'<h1 class="h1" style="margin-bottom:12px">'+esc(t('data_t'))+'</h1><p class="lead">'+esc(t('data_lead'))+'</p>'
    +'<section class="card" style="margin-top:18px"><div id="df">'+fields.map(f=>fieldHTML(f,S,'d-')).join('')+'</div><button type="button" class="btn primary" id="df-save" style="margin-top:16px">'+esc(t('save'))+'</button><div class="status" id="df-status" role="status" aria-live="polite"></div></section>';
  attachForm($('#df'),S,{changed(){$('#df-status').textContent='';}});
  $('#df-save').onclick=()=>{
    const o={};CO_FIELDS.forEach(k=>o[k]=S['co_'+k]);
    o.showaddr=!!o.showaddr;
    CO=Object.assign({},CO_DEF,o);store.set('company',o);
    const st=$('#df-status');st.textContent=t('data_saved');st.className='status ok';
  };
}
/* ================= shell ================= */
const VIEWS=['inicio','site','garantia','entrega','contrato','recibo','clientes','dados'];
let currentView='inicio';
function route(){const h=(location.hash||'').replace(/^#\/?/,'');return VIEWS.includes(h)?h:'inicio';}
function show(keepScroll){
  currentView=route();
  const app=$('#app');
  const fresh=app.cloneNode(false);app.parentNode.replaceChild(fresh,app);
  cur=null;
  document.body.classList.toggle('has-bar',!!PFX[currentView]);
  document.querySelector('main').className=PFX[currentView]?'wide':currentView==='site'?'site':'';
  if(PFX[currentView])viewDoc(fresh,currentView);
  else if(currentView==='site')viewSite(fresh);
  else if(currentView==='clientes')viewClientes(fresh);
  else if(currentView==='dados')viewDados(fresh);
  else viewInicio(fresh);
  $$('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===LANG?'true':'false'));
  try{document.documentElement.lang=LANG==='pt'?'pt-BR':LANG;}catch(e){}
  if(!keepScroll)window.scrollTo(0,0);
}
function setLang(l){
  if(!I18N[l]||l===LANG)return;
  LANG=l;store.set('lang',l);show(true);
}
function boot(){
  $$('img[data-logo]').forEach(i=>i.src=LOGO);
  $$('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
  window.addEventListener('hashchange',()=>show(false));
  window.addEventListener('resize',()=>{if(cur)fitPaper();});
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-copy]');if(!b)return;
    const r=await copyText(b.dataset.copy,b.closest('.c-item,.s-num')&&b.closest('.c-item,.s-num').querySelector('.v,span'));
    const old=b.dataset.label||b.textContent;b.dataset.label=old;
    b.textContent=r==='copied'?t('copied'):t('st_sel');
    clearTimeout(b._t);b._t=setTimeout(()=>{b.textContent=b.dataset.label;},2200);
  });
  show(false);
}
boot();
