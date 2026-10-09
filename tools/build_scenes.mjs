import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import vm from 'node:vm';
mkdirSync('scene-data',{recursive:true});
const context={window:{}};vm.runInNewContext(readFileSync('dist/words.js','utf8'),context);
const first={id:'03',season:'spring',titleJa:'春の教室',titlePt:'A primavera na sala de aula',listTitle:'教室のことば',image:'assets/classroom-generated.webp',original:'assets/classroom-original.png',words:context.window.DICTIONARY.map(w=>({...w,ttsJa:({crayons:'クレヨン',door:'ドア'})[w.id]||w.ja,audio:{ja:`audio/${w.id}-ja.mp3`,pt:`audio/${w.id}-pt.mp3`}}))};
writeFileSync('scene-data/scene-03.json',JSON.stringify(first,null,2)+'\n');
const scenes=readdirSync('scene-data').filter(name=>/^scene-\d\d\.json$/.test(name)).sort().map(name=>JSON.parse(readFileSync(`scene-data/${name}`,'utf8')));
const ids=new Set();let count=0;
for(const scene of scenes){
  if(ids.has(scene.id))throw new Error('Duplicate scene');ids.add(scene.id);
  for(const field of ['id','season','titleJa','titlePt','listTitle','image','original'])if(!scene[field])throw new Error(`Missing ${field}: ${scene.id}`);
  for(const asset of [scene.image,scene.original])if(!existsSync(`dist/${asset}`))throw new Error(`Missing image: ${asset}`);
  const wordIds=new Set();
  for(const word of scene.words){
    if(wordIds.has(word.id)||!word.ja||!word.pt||!/^[a-zA-Z0-9_-]+$/.test(word.id))throw new Error(`Invalid word: ${scene.id}/${word.id}`);wordIds.add(word.id);
    const [x,y,w,h]=word.rect,[mx,my]=word.marker;
    if([x,y,w,h,mx,my].some(v=>!Number.isFinite(v))||x<0||y<0||w<=0||h<=0||x+w>1000||y+h>707||mx<x||mx>x+w||my<y||my>y+h)throw new Error(`Invalid coordinates: ${scene.id}/${word.id}`);
    word.audio??={ja:`audio/s${scene.id}-${word.id}-ja.mp3`,pt:`audio/s${scene.id}-${word.id}-pt.mp3`};count++;
  }
}
writeFileSync('dist/scenes.js',`window.SCENES = ${JSON.stringify(scenes,null,2)};\n`);
writeFileSync('dist/scenes.json',JSON.stringify(scenes,null,2)+'\n');
console.log(JSON.stringify({scenes:scenes.length,words:count,ids:[...ids]}));
