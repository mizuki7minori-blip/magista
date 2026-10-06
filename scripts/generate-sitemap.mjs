import fs from 'node:fs';

const root=process.cwd();
const data=JSON.parse(fs.readFileSync(root+'/article-index.json','utf8'));
const today=new Date().toISOString().slice(0,10);

const staticPages=[
  ['https://magsta.jp/',today,'daily','1.0'],
  ['https://magsta.jp/articles.html',today,'daily','0.9'],
  ['https://magsta.jp/category.html',today,'daily','0.7'],
  ['https://magsta.jp/limited.html',today,'daily','0.9'],
  ['https://magsta.jp/draft-simulator.html',today,'weekly','0.8'],
  ['https://magsta.jp/limited-tracker.html',today,'weekly','0.8'],
  ['https://magsta.jp/commander.html',today,'weekly','0.9'],
  ['https://magsta.jp/commander-builder.html',today,'weekly','0.8'],
  ['https://magsta.jp/search.html',today,'weekly','0.6'],
  ['https://magsta.jp/weekly.html',today,'weekly','0.7'],
  ['https://magsta.jp/strategy.html',today,'monthly','0.6'],
  ['https://magsta.jp/contact.html',today,'monthly','0.4'],
  ['https://magsta.jp/privacy.html',today,'yearly','0.5'],
  ['https://magsta.jp/en/',today,'weekly','0.5'],
  ['https://magsta.jp/en/articles.html',today,'weekly','0.5']
];

const articlePages=(data.items||[]).map(item=>[
  'https://magsta.jp/'+item.path,
  String(item.modified||item.published||today).slice(0,10),
  'weekly',
  item.category==='news'||item.category==='tournament'?'0.9':'0.8'
]);

const rows=[...staticPages,...articlePages];
const xml='<?xml version="1.0" encoding="UTF-8"?>\n'
  +'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  +rows.map(([loc,lastmod,changefreq,priority])=>
    '  <url><loc>'+loc+'</loc><lastmod>'+lastmod+'</lastmod><changefreq>'+changefreq+'</changefreq><priority>'+priority+'</priority></url>'
  ).join('\n')
  +'\n</urlset>\n';

fs.writeFileSync(root+'/sitemap.xml',xml);
console.log('Generated sitemap.xml:',rows.length,'URLs');
