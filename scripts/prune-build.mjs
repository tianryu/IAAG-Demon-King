import fs from 'node:fs';
import path from 'node:path';
// Remove only hashed entry bundles produced by previous Vite builds.
const root=path.resolve('dist/assets'),html=fs.readFileSync('dist/index.html','utf8');
for(const name of fs.readdirSync(root)){
 if(!/^index-[\w-]+\.(js|css)$/.test(name)||html.includes(name))continue;
 const target=path.resolve(root,name);if(path.dirname(target)!==root)throw Error('Invalid output path');fs.unlinkSync(target);
}
