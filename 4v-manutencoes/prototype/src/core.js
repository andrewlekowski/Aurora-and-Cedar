const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LOGO='__LOGO__',PHOTO='__PHOTO__';
const URL_H2P='https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';
const URL_DOCX='https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';
const WA_NUM='5512997881836';
const mem={};
const store={
  get(k,d){
    try{const v=localStorage.getItem('v4:'+k);if(v!==null)return JSON.parse(v);}catch(e){}
    return (k in mem)?JSON.parse(JSON.stringify(mem[k])):d;
  },
  set(k,v){mem[k]=v;try{localStorage.setItem('v4:'+k,JSON.stringify(v));}catch(e){}},
  del(k){delete mem[k];try{localStorage.removeItem('v4:'+k);}catch(e){}}
};
let LANG=store.get('lang','pt');
if(!I18N[LANG])LANG='pt';
const t=k=>{const v=I18N[LANG][k];return v===undefined?(I18N.pt[k]!==undefined?I18N.pt[k]:k):v;};
const CO_DEF={razao:'Valdir de Paula Bicudo ME',nome:'Valdir de Paula Bicudo',cnpj:'21.914.770/0001-10',ie:'Isento',end:'Rua São Marcos, 126 – Jardim São José',cidade:'Jacareí – SP',cep:'12327-668',end2:'',whats:'(12) 99788-1836',email:'4Vmanutencoes@gmail.com',cidpad:'Jacareí',foro:'Jacareí – SP',showaddr:false};
let CO=Object.assign({},CO_DEF,store.get('company',{}));
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function fmtDate(iso,lang){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||'');
  if(!m)return '';
  const d=new Date(+m[1],+m[2]-1,+m[3]);
  try{return new Intl.DateTimeFormat(DOCT[lang].loc,{day:'numeric',month:'long',year:'numeric'}).format(d);}catch(e){return iso;}
}
const sanitizeName=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
function loadScript(url,glob){
  if(window[glob])return Promise.resolve();
  window.__ls=window.__ls||{};
  if(window.__ls[url])return window.__ls[url];
  window.__ls[url]=new Promise((res,rej)=>{
    const s=document.createElement('script');s.src=url;s.async=true;
    s.onload=()=>window[glob]?res():rej(new Error('lib'));
    s.onerror=()=>{delete window.__ls[url];rej(new Error('load'));};
    document.head.appendChild(s);
  });
  return window.__ls[url];
}
async function copyText(text,node){
  // returns 'copied' | 'selected'
  try{await navigator.clipboard.writeText(text);return 'copied';}catch(e){}
  try{
    const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');
    ta.style.cssText='position:fixed;left:0;top:0;opacity:0;font-size:16px';
    document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,text.length);
    const ok=document.execCommand&&document.execCommand('copy');ta.remove();
    if(ok)return 'copied';
  }catch(e){}
  try{
    if(node){
      if(node.select){node.focus();node.select();}
      else{const r=document.createRange();r.selectNodeContents(node);const s=getSelection();s.removeAllRanges();s.addRange(r);}
    }
  }catch(e){}
  return 'selected';
}
async function saveFile(filename,blob){
  // returns 'saved' | 'cancelled' | 'unavailable'
  let dl=null;
  try{dl=await (window.claude&&window.claude.use?window.claude.use('downloads'):null);}catch(e){dl=null;}
  if(!dl||!dl.save)return 'unavailable';
  try{await dl.save({filename,data:blob});return 'saved';}
  catch(e){return (e&&e.code==='declined')?'cancelled':'unavailable';}
}
