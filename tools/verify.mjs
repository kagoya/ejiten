import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/kagoya/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
mkdirSync('qa',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const errors=[],report={scenes:[],mobile:[]};
function monitor(page){page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1150}});monitor(page);
  await page.goto('http://127.0.0.1:8765/#scene-03');await page.locator('.word-item').last().waitFor();
  const scenes=await page.evaluate(()=>window.SCENES);
  if(scenes.length!==12)throw new Error(`Expected 12 scenes; found ${scenes.length}`);
  if(scenes.reduce((n,s)=>n+s.words.length,0)!==137)throw new Error('Expected 137 entries');
  for(const scene of scenes){
    await page.selectOption('#scene-select',scene.id);await page.waitForFunction(id=>document.getElementById('scene-select').value===id,scene.id);
    await page.waitForFunction(title=>document.getElementById('scene-title-ja').textContent===title,scene.titleJa);
    const count=await page.locator('.word-item').count();if(count!==scene.words.length)throw new Error(`Word count ${scene.id}`);
    if(await page.locator('.hotspot').count()!==count)throw new Error(`Hotspot count ${scene.id}`);
    for(const word of scene.words){
      await page.locator(`[data-marker="${word.id}"]`).click();
      if(await page.locator('#selected-ja').textContent()!==word.ja)throw new Error(`Marker intercepted: ${scene.id}/${word.id}`);
      if(await page.locator(`.word-item[data-word="${word.id}"]`).getAttribute('aria-pressed')!=='true')throw new Error('Selection state mismatch');
    }
    await page.locator('#play-ja').click();await page.waitForFunction(()=>document.getElementById('audio').currentTime>0);
    await page.locator('#play-pt').click();await page.waitForFunction(()=>document.getElementById('audio').currentTime>0 && document.getElementById('audio').src.endsWith('-pt.mp3'));
    await page.locator('#show-original').click();if(!await page.locator('#original-dialog').evaluate(e=>e.open))throw new Error('Original dialog failed');await page.keyboard.press('Escape');
    report.scenes.push({id:scene.id,title:scene.titleJa,words:count,markerClicks:count,japanesePlayback:true,portuguesePlayback:true});
    await page.screenshot({path:`qa/desktop-${scene.id}.png`,fullPage:true});
  }
  if(!await page.locator('#next-scene').isDisabled())throw new Error('End boundary missing');
  await page.locator('#previous-scene').click();await page.waitForFunction(()=>location.hash==='#scene-13');await page.goBack();await page.waitForFunction(()=>location.hash==='#scene-14');
  await page.locator('#show-contents').click();if(await page.locator('.scene-card').count()!==12)throw new Error('Contents incomplete');await page.locator('.scene-card[data-scene="03"]').click();await page.waitForFunction(()=>location.hash==='#scene-03');if(!await page.locator('#previous-scene').isDisabled())throw new Error('Start boundary missing');
  await page.locator('#choose-pt').click();await page.locator('#next-scene').click();await page.waitForFunction(()=>location.hash==='#scene-04');if(await page.locator('#choose-pt').getAttribute('aria-pressed')!=='true')throw new Error('Language reset');
  await page.locator('#zoom-in').click();await page.locator('#zoom-in').click();await page.locator('#next-scene').click();await page.waitForFunction(()=>location.hash==='#scene-05');if(await page.locator('#zoom-label').textContent()!=='100%')throw new Error('Zoom reset missing');
  await page.locator('.hotspot').first().focus();await page.keyboard.press('Enter');report.keyboard=true;
  await page.locator('#slow').click();await page.locator('#play-ja').click();await page.waitForFunction(()=>document.getElementById('audio').currentTime>0);report.slowRate=await page.locator('#audio').evaluate(e=>e.playbackRate);
  // Decode every MP3, and ensure it contains audible samples, rather than checking only its extension or header.
  report.media=await page.evaluate(async()=>{
    const context=new AudioContext(),results=[];
    try{for(const scene of window.SCENES)for(const word of scene.words)for(const lang of ['ja','pt']){
      const response=await fetch(word.audio[lang]);if(!response.ok)throw new Error(`Missing ${word.audio[lang]}`);
      const buffer=await context.decodeAudioData(await response.arrayBuffer());const samples=buffer.getChannelData(0);let peak=0;for(const sample of samples)peak=Math.max(peak,Math.abs(sample));
      if(buffer.duration<.3||peak<.01)throw new Error(`Silent/invalid ${word.audio[lang]}`);results.push({scene:scene.id,id:word.id,lang,duration:buffer.duration,peak});
    }}finally{await context.close();}return results;
  });
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});monitor(mobile);await mobile.goto('http://127.0.0.1:8765/#scene-03');
  for(const scene of scenes){
    await mobile.selectOption('#scene-select',scene.id);await mobile.waitForFunction(title=>document.getElementById('scene-title-ja').textContent===title,scene.titleJa);
    const word=scene.words.find(w=>w.kind==='phrase')||scene.words.at(-1);await mobile.locator(`.word-item[data-word="${word.id}"]`).tap();await mobile.waitForFunction(()=>document.getElementById('audio').currentTime>0);
    const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw new Error(`Mobile overflow ${scene.id}`);
    await mobile.locator('#zoom-in').tap();await mobile.locator('#zoom-in').tap();if(await mobile.locator('#zoom-label').textContent()!=='200%')throw new Error('Zoom broken');await mobile.locator('#zoom-reset').tap();
    await mobile.screenshot({path:`qa/mobile-${scene.id}.png`,fullPage:true});report.mobile.push({id:scene.id,overflow,selected:word.ja,zoom:true});
  }
  await mobile.locator('#show-contents').tap();await mobile.locator('.scene-card[data-scene="08"]').tap();await mobile.waitForFunction(()=>location.hash==='#scene-08');
  await mobile.setViewportSize({width:844,height:390});report.landscapeOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(report.landscapeOverflow)throw new Error('Landscape overflow');
  await mobile.goto('http://127.0.0.1:8765/#scene-14');await mobile.waitForFunction(()=>document.getElementById('scene-title-ja').textContent===window.SCENES.at(-1).titleJa);report.deepLink=true;
  report.errors=errors;if(errors.length)throw new Error(errors.join('\n'));writeFileSync('qa/report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({scenes:report.scenes.length,words:report.scenes.reduce((n,s)=>n+s.words,0),decodedAudio:report.media.length,mobileScenes:report.mobile.length,errors,keyboard:report.keyboard,deepLink:report.deepLink,slowRate:report.slowRate},null,2));
}finally{await browser.close();}
