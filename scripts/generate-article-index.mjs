import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const files=fs.readdirSync(root).filter(name=>/^article-.*\.html$/i.test(name)&&name!=='article-template.html');

const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/\s+/g,' ').trim();
const pick=(html,re)=>clean((html.match(re)||[])[1]||'');
const iso=(html,key)=>((html.match(new RegExp('"'+key+'":"([^"]+)"'))||[])[1]||'');
const meta=(html,prop)=>((html.match(new RegExp('<meta[^>]+(?:property|name)="'+prop+'"[^>]+content="([^"]*)"','i'))||[])[1]||'');

const categoryMap=[
  [/リミテッド|ドラフト/i,['limited','リミテッド']],
  [/大会|メタゲーム|Modern|Standard|Pioneer|Legacy|Pauper/i,['tournament','大会・環境']],
  [/デッキ|環境/i,['deck','デッキ・環境']],
  [/.*/i,['news','ニュース']]
];

const items=files.map(file=>{
  const html=fs.readFileSync(path.join(root,file),'utf8');
  const title=pick(html,/<h1[^>]*>([\s\S]*?)<\/h1>/i)||pick(html,/<title>([\s\S]*?)<\/title>/i).replace(/\s*[｜|]\s*MAGSTA.*$/i,'');
  const description=meta(html,'description')||pick(html,/<p class="article-lead">([\s\S]*?)<\/p>/i);
  const lead=pick(html,/<p class="article-lead">([\s\S]*?)<\/p>/i)||description;
  const published=iso(html,'datePublished')||meta(html,'article:published_time');
  const modified=iso(html,'dateModified')||meta(html,'article:modified_time')||published;
  const tag=pick(html,/<span class="tag[^"]*">([\s\S]*?)<\/span>/i);
  const hay=[tag,title,description].join(' ');
  const found=categoryMap.find(row=>row[0].test(hay));
  const category=found[1][0], fallbackLabel=found[1][1];
  const cards=[...html.matchAll(/《([^》]{1,80})》/g)].map(m=>m[1]);
  const keywords=[...new Set(cards.slice(0,12))];
  return {path:file,category,label:tag||fallbackLabel,title,desc:description,lead,published,modified,keywords};
}).sort((a,b)=>Date.parse(b.published||0)-Date.parse(a.published||0));

fs.writeFileSync(path.join(root,'article-index.json'),JSON.stringify({updatedAt:new Date().toISOString(),items},null,2)+'\n');
console.log('Generated article-index.json:',items.length,'articles');
