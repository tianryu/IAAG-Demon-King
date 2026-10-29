import fs from 'node:fs';
import path from 'node:path';
function all(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?all(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=all('dist');const bytes=files.reduce((n,p)=>n+fs.statSync(p).size,0);
for(const name of ['art/buildings-v3.png','art/lords-v3.png','art/troops-v3.png','audio/dungeon.mp3','audio/click.wav','audio/upgrade.wav','audio/hit.wav','audio/shoot.wav','audio/coin.wav','audio/start.wav','audio/win.wav','audio/lose.wav']){const file=path.join('dist/assets',name);if(!fs.existsSync(file)||fs.statSync(file).size<100)throw Error('Missing or empty runtime asset: '+name);}
for(const name of ['skin-v4.png','icons-v4.png','title-v4.png','level-flag-v4.png']){const file=path.join('dist/assets/ui',name);if(!fs.existsSync(file)||fs.statSync(file).size<100)throw Error('Missing generated UI asset: '+name);}
const html=fs.readFileSync('dist/index.html','utf8');if(!html.includes('我是哥布林：魔王'))throw Error('Wrong game title');for(const f of files.filter(f=>/index-.*\.(js|css)$/.test(f))){if(!html.includes(path.basename(f)))throw Error('Unused build artifact: '+f);if(f.endsWith('.js')&&/qa-panel|模拟完播|installQA/.test(fs.readFileSync(f,'utf8')))throw Error('QA leaked into release');}
if(bytes>=20000000)throw Error('Release exceeds 20 MB');
if(files.some(p=>/concepts|assets[\\/]source|\.map$|node_modules|\.tools/.test(p)))throw Error('Source material leaked into release');
const strings=all('src').filter(f=>/\.(ts|css)$/.test(f));for(const f of strings)if(fs.readFileSync(f,'utf8').includes('\u00b7'))throw Error('Forbidden separator in '+f);
console.log(JSON.stringify({files:files.length,uncompressedBytes:bytes,megabytes:Number((bytes/1e6).toFixed(3)),limitBytes:20000000,passed:true},null,2));
