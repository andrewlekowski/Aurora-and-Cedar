const PFX={garantia:'G',entrega:'E',contrato:'C',recibo:'R'};
const VOLT_LBL=(v,lang)=>v==='127'?'127 V':v==='220'?'220 V':v==='bi'?I18N[lang].volt_bi:'';
const fill=(s,m)=>String(s).replace(/\{(\w+)\}/g,(_,k)=>m[k]!==undefined?m[k]:'');
function presetText(key,lang){
  const T=DOCT[lang];
  if(key==='selo')return T.o_selo;
  if(key==='contato')return fill(T.o_contato,{tel:CO.whats});
  const p=key.split('.');const a=T.presets[p[0]];
  return (a&&a[+p[1]])||'';
}
const orientText=(it,lang)=>it.text!==null&&it.text!==undefined?it.text:presetText(it.key,lang);
function presetOrient(tipo){
  const n=(DOCT.pt.presets[tipo]||DOCT.pt.presets.outro).length;
  const items=[];
  for(let i=0;i<n;i++)items.push({key:(DOCT.pt.presets[tipo]?tipo:'outro')+'.'+i,text:null,on:true});
  items.push({key:'selo',text:null,on:true},{key:'contato',text:null,on:true});
  return items;
}
function buildBlocks(type,S,lang){
  const T=DOCT[lang];
  const u=v=>String(v==null?'':v).replace(/\*\*/g,'*').trim();
  const bl=(v,n)=>u(v)||'_'.repeat(n||14);
  const dt=iso=>fmtDate(iso,lang);
  const term=()=>S.prazo==='other'?bl(S.prazo_other,12):(T.months[S.prazo]||T.months[3]);
  const place={t:'place',text:fill(T.place,{city:bl(S.city,12),date:dt(S.date)||'_'.repeat(16)})};
  const numTxt=T.num+' '+u(S.num);
  const cliRows=()=>{
    const r=[[T.k_name,bl(S.cli_name,30)]];
    if(u(S.cli_ac))r.push([T.k_ac,u(S.cli_ac)]);
    r.push([T.k_doc,bl(S.cli_doc,22)]);
    r.push([T.k_addr,bl(S.cli_addr,36)]);
    const city=[u(S.cli_city),u(S.cli_cep)?'CEP '+u(S.cli_cep):''].filter(Boolean).join(' — ');
    r.push([T.k_city,city||'_'.repeat(22)]);
    if(u(S.cli_phone))r.push([T.k_phone,u(S.cli_phone)]);
    if(u(S.cli_email))r.push([T.k_email,u(S.cli_email)]);
    return r;
  };
  const eqRows=()=>[[T.k_equip,bl(S.equip,30)],[T.k_brand,bl(S.brand,22)],[T.k_model,bl(S.model,22)],[T.k_serial,bl(S.serial,22)],[T.k_volt,VOLT_LBL(S.volt,lang)||'_'.repeat(14)]];
  const tel=u(CO.whats),mail=u(CO.email);
  let b=[];
  if(type==='garantia'){
    const parts=(S.parts||[]).filter(p=>u(p.qty)||u(p.name)).map(p=>[u(p.qty),u(p.name)]);
    if(!parts.length)for(let i=0;i<3;i++)parts.push(['','']);
    const start=dt(S.g_start||S.date)||'_'.repeat(16);
    b=[{t:'title',text:T.G_title,num:numTxt},
      {t:'h',text:T.sec_client},{t:'kv',rows:cliRows()},
      {t:'h',text:T.sec_equip},{t:'kv',rows:eqRows()},
      {t:'h',text:T.sec_service},
      {t:'kv',rows:[[T.k_svcdate,dt(S.svc_date)||'_'.repeat(16)],[T.k_desc,u(S.svc_desc)||('_'.repeat(44)+'\n'+'_'.repeat(44))]]},
      {t:'table',head:[T.th_qty,T.th_part],rows:parts,widths:[14,86]},
      {t:'h',text:T.sec_warranty},
      {t:'p',text:'1. '+fill(T.g1,{term:term(),start})},
      {t:'p',text:'2. '+T.g2},
      {t:'p',text:'3. '+T.g3},
      {t:'p',text:'4. '+fill(T.g4,{tel,email:mail})},
      {t:'p',text:'**'+T.nocover+'**'},
      {t:'ul',items:T.nc}];
    if(u(S.notes))b.push({t:'h',text:T.obs},{t:'p',text:u(S.notes)});
    b.push(place,{t:'sign',cols:[{lines:[{x:u(CO.nome),b:1},{x:T.sig_tech}]},{lines:[{x:T.sig_client},{x:T.sig_date}]}]});
  }else if(type==='entrega'){
    const items=(S.orient||[]).filter(o=>o.on).map(o=>u(orientText(o,lang))).filter(Boolean);
    const cr=[[T.sec_client,bl(S.cli_name,30)]];
    if(u(S.cli_ac))cr.push([T.k_ac,u(S.cli_ac)]);
    b=[{t:'title',text:T.E_title,num:numTxt},
      {t:'kv',rows:cr},
      {t:'p',text:T.E_intro},
      {t:'kv',rows:eqRows()}];
    b.push({t:'h',text:T.E_orient});
    b.push({t:'ol',items:items.length?items:['_'.repeat(50),'_'.repeat(50)]});
    if(S.incl_g!==false)b.push({t:'p',text:fill(T.E_warr,{term:term(),start:dt(S.date)||'_'.repeat(16)})});
    if(u(S.notes))b.push({t:'h',text:T.obs},{t:'p',text:u(S.notes)});
    b.push({t:'p',text:T.E_decl},place,{t:'sign',cols:[{lines:[{x:fill(T.E_by,{name:u(CO.nome)}),b:1}]},{lines:[{x:T.E_recv},{x:T.sig_date}]}]});
  }else if(type==='contrato'){
    const pj=S.cli_type==='pj';
    const v=parseMoney(S.valor);
    const items=(S.items||[]).filter(i=>u(i.desc)||u(i.serial)).map(i=>[u(i.desc),u(i.serial)]);
    if(!items.length)items.push(['','']);
    let pay=S.pay==='other'?bl(S.pay_other,20):(T.pays[S.pay]||T.pays.avista);
    const det=u(S.pay_det).replace(/[.\s]+$/,'');
    const buyer=pj?fill(T.C_pj,{name:bl(S.cli_name,28),doc:bl(S.cli_doc,18),addr:bl(S.cli_addr,30),city:bl(S.cli_city,16),cep:bl(S.cli_cep,10),rep:bl(S.cli_rep,28)})
      :fill(T.C_pf,{name:bl(S.cli_name,28),nat:bl(S.cli_nat,14),rg:bl(S.cli_rg,14),doc:bl(S.cli_doc,16),addr:bl(S.cli_addr,30),city:bl(S.cli_city,16),cep:bl(S.cli_cep,10)});
    const witness=(n,val)=>({lines:u(val)?[{x:fill(T.C_wit,{n}),b:1},{x:u(val)}]:[{x:fill(T.C_wit,{n}),b:1},{x:fill(T.C_name,{v:'_'.repeat(20)})},{x:fill(T.C_cpf,{v:'_'.repeat(16)})}]});
    b=[{t:'title',text:T.C_title,num:numTxt},
      {t:'p',text:fill(T.C_seller,{razao:u(CO.razao),cnpj:u(CO.cnpj),ie:u(CO.ie),addr:u(CO.end),city:u(CO.cidade),cep:u(CO.cep),resp:u(CO.nome)})},
      {t:'p',text:buyer},
      {t:'p',text:T.C_agree},
      {t:'ch',text:T.C_h[0]},{t:'p',text:fill(T.C_1,{state:T.states[S.estado]||T.states.usado})},
      {t:'table',head:T.C_th,rows:items,widths:[68,32]},
      {t:'ch',text:T.C_h[1]},{t:'p',text:fill(T.C_2,{value:isNaN(v)?'_'.repeat(14):fmtBRL(v),words:isNaN(v)?'_'.repeat(26):extenso(v,lang),pay,det:det?'; '+det:''})},
      {t:'ch',text:T.C_h[2]},{t:'p',text:fill(T.C_3,{date:dt(S.deliv_date)||'_'.repeat(16)})},
      {t:'ch',text:T.C_h[3]},{t:'p',text:T.C_4[S.deliv_how]||T.C_4.retira},
      {t:'ch',text:T.C_h[4]},{t:'p',text:T.C_5},
      {t:'ch',text:T.C_h[5]}].concat(T.C_6.map(x=>({t:'p',text:fill(x,{term:term(),tel,email:mail})})),[
      {t:'ch',text:T.C_h[6]},{t:'p',text:T.C_7},
      {t:'ch',text:T.C_h[7]},{t:'p',text:T.C_8},
      {t:'ch',text:T.C_h[8]},{t:'p',text:fill(T.C_9,{foro:bl(S.foro,18)})},
      {t:'p',text:T.C_close},place,
      {t:'sign',cols:[{lines:[{x:T.C_sellerRole,b:1},{x:u(CO.razao)},{x:fill(T.C_cnpj,{v:u(CO.cnpj)})}]},{lines:[{x:T.C_buyerRole,b:1},{x:bl(S.cli_name,24)},{x:fill(pj?T.C_cnpj:T.C_cpfdoc,{v:bl(S.cli_doc,18)})}]}]},
      {t:'sign',cols:[witness(1,S.wit1),witness(2,S.wit2)]}]);
  }else if(type==='recibo'){
    const v=parseMoney(S.valor);
    b=[{t:'rec',text:T.R_title+' '+numTxt,amount:'R$ '+(isNaN(v)?'__________':fmtBRL(v))},
      {t:'p',text:fill(T.R_1,{name:bl(S.cli_name,30),doc:bl(S.cli_doc,20),value:isNaN(v)?'_'.repeat(12):fmtBRL(v),words:isNaN(v)?'_'.repeat(26):extenso(v,lang),ref:u(S.ref)||'_'.repeat(40)})},
      {t:'p',text:fill(T.R_2,{pay:T.rpays[S.rpay]||T.rpays.dinheiro})},
      {t:'p',text:T.R_3},place,
      {t:'sign',cols:[{lines:[{x:u(CO.nome),b:1},{x:u(CO.razao)+' — CNPJ '+u(CO.cnpj)}]}],single:1}];
  }
  return [{t:'head'}].concat(b);
}
function docFilename(type,S,lang,ext){
  const nm=sanitizeName(S.cli_name);
  return DOCT[lang].fn[PFX[type]]+'-'+sanitizeName(S.num)+(nm?'-'+nm:'')+'.'+ext;
}
/* ---------- HTML ---------- */
const fmtB=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
function headLines(lang){
  const T=DOCT[lang];
  const contact=T.wapp+' '+CO.whats+' · '+CO.email+' · CNPJ '+CO.cnpj;
  const addr=CO.showaddr?[CO.end,CO.cidade,CO.cep?'CEP '+CO.cep:''].filter(Boolean).join(', ')+(CO.end2?' | '+CO.end2:''):'';
  return {sub:T.sub,contact,addr};
}
function blocksHTML(blocks,lang){
  let h='';
  blocks.forEach(x=>{
    switch(x.t){
      case 'head':{const L=headLines(lang);h+='<div class="d-head"><img src="'+LOGO+'" alt=""><div><div class="d-brand">4V Manutencoes</div><div class="d-sub">'+esc(L.sub)+'</div><div class="d-contact">'+esc(L.contact)+'</div>'+(L.addr?'<div class="d-addr">'+esc(L.addr)+'</div>':'')+'</div></div>';break;}
      case 'title':h+='<div class="d-title"><h1>'+esc(x.text)+'</h1><span class="d-num">'+esc(x.num)+'</span></div>';break;
      case 'rec':h+='<div class="d-rec"><h1>'+esc(x.text)+'</h1><div class="d-box">'+esc(x.amount)+'</div></div>';break;
      case 'h':h+='<h2 class="d-h">'+esc(x.text)+'</h2>';break;
      case 'ch':h+='<h3 class="d-ch">'+esc(x.text)+'</h3>';break;
      case 'p':h+='<p class="d-p">'+fmtB(x.text)+'</p>';break;
      case 'place':h+='<p class="d-place">'+esc(x.text)+'</p>';break;
      case 'kv':h+='<table class="d-kv">'+x.rows.map(r=>'<tr><th>'+esc(r[0])+'</th><td style="white-space:pre-wrap">'+esc(r[1])+'</td></tr>').join('')+'</table>';break;
      case 'table':h+='<table class="d-tb"><thead><tr>'+x.head.map((c,i)=>'<th style="width:'+x.widths[i]+'%">'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+x.rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';break;
      case 'ol':h+='<ol class="d-ol">'+x.items.map(i=>'<li>'+fmtB(i)+'</li>').join('')+'</ol>';break;
      case 'ul':h+='<ul class="d-ul">'+x.items.map(i=>'<li>'+fmtB(i)+'</li>').join('')+'</ul>';break;
      case 'sign':h+='<div class="d-sign">'+x.cols.map(c=>'<div class="sig">'+c.lines.map(l=>l.b?'<b>'+esc(l.x)+'</b>':'<div>'+esc(l.x)+'</div>').join('')+'</div>').join('')+(x.single?'<div class="sig" style="visibility:hidden;border:0"></div>':'')+'</div>';break;
    }
  });
  return '<div class="paper">'+h+'</div>';
}
/* ---------- plain text ---------- */
function blocksText(blocks,lang){
  const bold=s=>String(s).replace(/\*\*(.+?)\*\*/g,'*$1*');
  const o=[];
  blocks.forEach(x=>{
    switch(x.t){
      case 'head':{const L=headLines(lang);o.push('*4V Manutencoes*',L.sub,L.contact);if(L.addr)o.push(L.addr);o.push('');break;}
      case 'title':o.push('*'+x.text+'*  '+x.num,'');break;
      case 'rec':o.push('*'+x.text+'*  '+x.amount,'');break;
      case 'h':case 'ch':o.push('','*'+x.text+'*');break;
      case 'p':o.push(bold(x.text),'');break;
      case 'place':o.push('',x.text,'');break;
      case 'kv':x.rows.forEach(r=>o.push(r[0]+': '+r[1].replace(/\n/g,' ')));break;
      case 'table':o.push(x.head.join(' | '));x.rows.forEach(r=>o.push(r.join(' | ')));o.push('');break;
      case 'ol':x.items.forEach((i,n)=>o.push((n+1)+'. '+bold(i)));o.push('');break;
      case 'ul':x.items.forEach(i=>o.push('- '+bold(i)));o.push('');break;
      case 'sign':x.cols.forEach(c=>{o.push('',c.lines.map(l=>l.x).join(' — '));});break;
    }
  });
  return o.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
/* ---------- DOCX ---------- */
function dataUriBytes(uri){const b=atob(uri.split(',')[1]);const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function buildDocx(blocks,lang){
  const D=docx;
  const W=9638;
  const NONE={style:D.BorderStyle.NONE,size:0,color:'FFFFFF'};
  const noB={top:NONE,bottom:NONE,left:NONE,right:NONE};
  const FONT='Arial';
  const runs=(text,o)=>{
    o=o||{};const out=[];
    String(text).split('\n').forEach((line,li)=>{
      line.split(/(\*\*.+?\*\*)/).filter(s=>s!=='').forEach((seg,i)=>{
        const bd=/^\*\*.+\*\*$/.test(seg);
        out.push(new D.TextRun({text:bd?seg.slice(2,-2):seg,bold:bd||!!o.bold,size:o.size||22,font:FONT,break:(li>0&&i===0)?1:undefined}));
      });
    });
    return out;
  };
  const para=(text,o)=>{o=o||{};return new D.Paragraph({children:runs(text,o),spacing:{before:o.before||0,after:o.after===undefined?100:o.after},alignment:o.align,indent:o.indent,border:o.border,keepNext:o.keepNext});};
  const cell=(children,w,o)=>{o=o||{};return new D.TableCell({children:children,width:{size:w,type:D.WidthType.DXA},borders:o.borders||noB,margins:{top:o.mt===undefined?50:o.mt,bottom:o.mb===undefined?50:o.mb,left:o.ml===undefined?80:o.ml,right:o.mr===undefined?80:o.mr},shading:o.shade?{type:D.ShadingType.CLEAR,fill:o.shade,color:'auto'}:undefined,verticalAlign:o.va});};
  const tbl=(rows,widths,o)=>new D.Table({rows:rows,width:{size:widths.reduce((a,c)=>a+c,0),type:D.WidthType.DXA},columnWidths:widths,borders:o&&o.borders||{top:NONE,bottom:NONE,left:NONE,right:NONE,insideHorizontal:NONE,insideVertical:NONE}});
  const thin={style:D.BorderStyle.SINGLE,size:4,color:'888888'};
  const kids=[];
  blocks.forEach(x=>{
    switch(x.t){
      case 'head':{
        const L=headLines(lang);
        const txt=[para('4V Manutencoes',{bold:true,size:36,after:0}),para(L.sub,{size:20,after:0}),para(L.contact,{size:18,after:0})];
        if(L.addr)txt.push(para(L.addr,{size:18,after:0}));
        kids.push(tbl([new D.TableRow({children:[
          cell([new D.Paragraph({children:[new D.ImageRun({data:dataUriBytes(LOGO),transformation:{width:56,height:56},type:'png'})]})],1100,{ml:0}),
          cell(txt,W-1100,{va:D.VerticalAlign.CENTER})]})],[1100,W-1100]));
        kids.push(new D.Paragraph({children:[],spacing:{after:200},border:{bottom:{style:D.BorderStyle.SINGLE,size:16,color:'000000',space:1}}}));
        break;}
      case 'title':
        kids.push(tbl([new D.TableRow({children:[cell([para(x.text,{bold:true,size:28,after:0})],W-2300,{ml:0}),cell([para(x.num,{bold:true,after:0,align:D.AlignmentType.RIGHT})],2300,{mr:0,va:D.VerticalAlign.BOTTOM})]})],[W-2300,2300]));
        kids.push(para('',{after:80}));break;
      case 'rec':
        kids.push(tbl([new D.TableRow({children:[cell([para(x.text,{bold:true,size:36,after:0})],W-3300,{ml:0,va:D.VerticalAlign.CENTER}),
          cell([para(x.amount,{bold:true,size:36,after:0,align:D.AlignmentType.CENTER})],3300,{borders:{top:{style:D.BorderStyle.SINGLE,size:16,color:'000000'},bottom:{style:D.BorderStyle.SINGLE,size:16,color:'000000'},left:{style:D.BorderStyle.SINGLE,size:16,color:'000000'},right:{style:D.BorderStyle.SINGLE,size:16,color:'000000'}},mt:140,mb:140})]})],[W-3300,3300]));
        kids.push(para('',{after:160}));break;
      case 'h':kids.push(para(x.text.toUpperCase(),{bold:true,size:22,before:240,after:100,keepNext:true,border:{bottom:{style:D.BorderStyle.SINGLE,size:6,color:'000000',space:2}}}));break;
      case 'ch':kids.push(para(x.text,{bold:true,size:22,before:200,after:40,keepNext:true}));break;
      case 'p':kids.push(para(x.text,{align:D.AlignmentType.LEFT}));break;
      case 'place':kids.push(para(x.text,{align:D.AlignmentType.RIGHT,before:300,after:100}));break;
      case 'kv':{
        const rows=x.rows.map(r=>new D.TableRow({cantSplit:true,children:[cell([para(r[0],{bold:true,after:0})],2900,{ml:0}),cell([para(r[1],{after:0})],W-2900,{borders:{top:NONE,left:NONE,right:NONE,bottom:thin}})]}));
        kids.push(tbl(rows,[2900,W-2900]));kids.push(para('',{after:60}));break;}
      case 'table':{
        const ws=x.widths.map(p=>Math.round(W*p/100));ws[ws.length-1]=W-ws.slice(0,-1).reduce((a,c)=>a+c,0);
        const bd={top:thin,bottom:thin,left:thin,right:thin};
        const rows=[new D.TableRow({tableHeader:true,children:x.head.map((c,i)=>cell([para(c,{bold:true,after:0})],ws[i],{borders:bd,shade:'E6E6E6'}))})]
          .concat(x.rows.map(r=>new D.TableRow({cantSplit:true,height:{value:420,rule:D.HeightRule.ATLEAST},children:r.map((c,i)=>cell([para(c,{after:0})],ws[i],{borders:bd}))})));
        kids.push(tbl(rows,ws));kids.push(para('',{after:60}));break;}
      case 'ol':x.items.forEach((i,n)=>kids.push(para((n+1)+'.\t'+i,{after:60,indent:{left:420,hanging:420}})));break;
      case 'ul':x.items.forEach(i=>kids.push(para('•\t'+i,{after:60,indent:{left:420,hanging:420}})));break;
      case 'sign':{
        const n=x.single?2:x.cols.length;const gap=300;const cw=Math.floor(W/n);
        const cols=x.cols.slice();if(x.single)cols.push({lines:[]});
        const cells=cols.map((c,i)=>cell(c.lines.length?[para('',{after:0,before:700})].concat(c.lines.map((l,li)=>para(l.x,{bold:!!l.b,size:20,after:0,border:li===0?{top:{style:D.BorderStyle.SINGLE,size:8,color:'000000',space:4}}:undefined}))):[para('',{after:0})],i===cols.length-1?W-cw*(n-1):cw,{ml:i===0?0:gap/2,mr:i===cols.length-1?0:gap/2}));
        kids.push(tbl([new D.TableRow({cantSplit:true,children:cells})],cols.map((c,i)=>i===cols.length-1?W-cw*(n-1):cw)));
        kids.push(para('',{after:60}));break;}
    }
  });
  return new D.Document({
    creator:'4V Manutencoes',title:'4V Manutencoes',
    styles:{default:{document:{run:{font:FONT,size:22}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},children:kids}]
  });
}
