/*EXT-START*/
const EXT_PT={
  U:['','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'],
  T:['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'],
  H:['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']};
function ptBelow1000(n){
  if(n===100)return 'cem';
  const h=Math.floor(n/100),r=n%100,p=[];
  if(h)p.push(EXT_PT.H[h]);
  if(r)p.push(r<20?EXT_PT.U[r]:EXT_PT.T[Math.floor(r/10)]+(r%10?' e '+EXT_PT.U[r%10]:''));
  return p.join(' e ');
}
function joinPt(g){
  let out='';
  g.forEach((x,i)=>{
    if(i===0)out=x.text;
    else{const last=i===g.length-1;out+=((last&&(x.val<100||x.val%100===0))?' e ':' ')+x.text;}
  });
  return out;
}
function ptInt(n){
  if(n===0)return 'zero';
  const mi=Math.floor(n/1e6),th=Math.floor(n%1e6/1000),u=n%1000,g=[];
  if(mi)g.push({text:mi===1?'um milhão':ptBelow1000(mi)+' milhões',val:mi});
  if(th)g.push({text:th===1?'mil':ptBelow1000(th)+' mil',val:th});
  if(u)g.push({text:ptBelow1000(u),val:u});
  return joinPt(g);
}
const EXT_EN={
  U:['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'],
  T:['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']};
function enBelow1000(n){
  const h=Math.floor(n/100),r=n%100,p=[];
  if(h)p.push(EXT_EN.U[h]+' hundred');
  if(r)p.push(r<20?EXT_EN.U[r]:EXT_EN.T[Math.floor(r/10)]+(r%10?'-'+EXT_EN.U[r%10]:''));
  return p.join(' ');
}
function enInt(n){
  if(n===0)return 'zero';
  const mi=Math.floor(n/1e6),th=Math.floor(n%1e6/1000),u=n%1000,p=[];
  if(mi)p.push(enBelow1000(mi)+' million');
  if(th)p.push(enBelow1000(th)+' thousand');
  if(u)p.push(enBelow1000(u));
  return p.join(' ');
}
const FR_U=['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
function frBelow100(n,terminal){
  if(n<20)return FR_U[n];
  const t=Math.floor(n/10),u=n%10;
  if(t<=6){
    const b=['','','vingt','trente','quarante','cinquante','soixante'][t];
    if(u===0)return b;
    return u===1?b+' et un':b+'-'+FR_U[u];
  }
  if(t===7)return u===1?'soixante et onze':'soixante-'+FR_U[10+u];
  if(t===8)return u===0?(terminal?'quatre-vingts':'quatre-vingt'):'quatre-vingt-'+FR_U[u];
  return 'quatre-vingt-'+FR_U[10+u];
}
function frBelow1000(n,terminal){
  const h=Math.floor(n/100),r=n%100;
  if(h===0)return frBelow100(r,terminal);
  if(h===1)return 'cent'+(r?' '+frBelow100(r,terminal):'');
  return FR_U[h]+' cent'+(r===0?(terminal?'s':''):' '+frBelow100(r,terminal));
}
function frInt(n){
  if(n===0)return 'zéro';
  const mi=Math.floor(n/1e6),th=Math.floor(n%1e6/1000),u=n%1000,p=[];
  if(mi)p.push(mi===1?'un million':frBelow1000(mi,true)+' millions');
  if(th)p.push(th===1?'mille':frBelow1000(th,false)+' mille');
  if(u)p.push(frBelow1000(u,true));
  return p.join(' ');
}
function extenso(value,lang){
  const cents=Math.round(Number(value)*100);
  if(!isFinite(cents)||cents<0||cents>=1e11)return '';
  const r=Math.floor(cents/100),c=cents%100;
  const L={
    pt:{int:ptInt,real:'real',reais:'reais',de:' de reais',cent:'centavo',cents:'centavos',and:' e ',zero:'zero reais'},
    en:{int:enInt,real:'real',reais:'reais',de:' reais',cent:'centavo',cents:'centavos',and:' and ',zero:'zero reais'},
    fr:{int:frInt,real:'réal',reais:'reais',de:' de reais',cent:'centavo',cents:'centavos',and:' et ',zero:'zéro réal'}
  }[lang]||null;
  if(!L)return '';
  const parts=[];
  if(r>0){
    if(r===1)parts.push((lang==='pt'?'um':lang==='en'?'one':'un')+' '+L.real);
    else parts.push(L.int(r)+(r%1e6===0?L.de:' '+L.reais));
  }
  if(c>0)parts.push(L.int(c)+' '+(c===1?L.cent:L.cents));
  if(!parts.length)return L.zero;
  return parts.join(L.and);
}
function parseMoney(s){
  s=String(s==null?'':s).replace(/[^\d.,]/g,'');
  if(!s||!/\d/.test(s))return NaN;
  if(s.indexOf(',')>=0)s=s.replace(/\./g,'').replace(',','.');
  else if(s.indexOf('.')>=0){
    if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
    else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,'');
  }
  const v=parseFloat(s);
  return isFinite(v)?v:NaN;
}
function fmtBRL(v){
  const c=Math.round(v*100),r=Math.floor(c/100),cc=c%100;
  return String(r).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+String(cc).padStart(2,'0');
}
/*EXT-END*/
