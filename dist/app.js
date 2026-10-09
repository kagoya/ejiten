(() => {
  'use strict';
  const words=window.DICTIONARY, $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
  let selected=words[0], language='ja', zoom=1, slow=false, playToken=0;
  const heard=new Set(), audio=$('audio'), groups=new Map(), buttons=new Map();
  function svg(tag,attrs){const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
  for(const word of [...words].sort((a,b)=>b.rect[2]*b.rect[3]-a.rect[2]*a.rect[3])){
    const index=words.indexOf(word),g=svg('g',{'class':'hotspot','role':'button','tabindex':'0','aria-label':`${word.ja} / ${word.pt}`,'aria-pressed':'false','data-word':word.id});
    const [x,y,width,height]=word.rect;g.append(svg('rect',{x,y,width,height,'class':'hit'}));
    const marker=svg('g',{'class':'marker'});marker.append(svg('circle',{cx:word.marker[0],cy:word.marker[1],r:16}));const number=svg('text',{x:word.marker[0],y:word.marker[1]});number.textContent=index+1;marker.append(number);g.append(marker);
    g.addEventListener('click',()=>select(word,true,false));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(word,true,false);}});
    $('hotspots').append(g);groups.set(word.id,g);
  }
  words.forEach((word,index)=>{
    const button=document.createElement('button');button.className='word-item';button.dataset.word=word.id;button.setAttribute('aria-pressed','false');
    button.innerHTML=`<span class="item-number">${String(index+1).padStart(2,'0')}</span><span class="item-name"><span>${word.ja}</span><small lang="pt-BR">${word.pt}</small></span><svg aria-hidden="true"><use href="#speaker"/></svg>`;
    button.addEventListener('click',()=>select(word,true,true));$('word-list').append(button);buttons.set(word.id,button);
  });
  function stop(){playToken++;audio.pause();audio.currentTime=0;$('sound-wave').classList.remove('playing');}
  function select(word,autoplay,center){
    stop();selected=word;
    const index=words.indexOf(word);$('selected-number').textContent=String(index+1).padStart(2,'0');$('selected-ja').textContent=word.ja;$('selected-pt').textContent=word.pt;
    for(const w of words){groups.get(w.id).classList.toggle('is-selected',w.id===word.id);groups.get(w.id).setAttribute('aria-pressed',String(w.id===word.id));buttons.get(w.id).setAttribute('aria-pressed',String(w.id===word.id));}
    $('audio-status').textContent='再生ボタンでことばを聴けます。';
    if(center && zoom>1){const viewport=$('scene-viewport'),canvas=$('scene-canvas');viewport.scrollTo({left:word.marker[0]/1000*canvas.clientWidth-viewport.clientWidth/2,top:word.marker[1]/707*canvas.clientHeight-viewport.clientHeight/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
    if(autoplay)play(language);
  }
  async function play(lang){
    stop();const token=playToken, word=selected;
    audio.src=`audio/${word.id}-${lang}.mp3`;audio.playbackRate=slow?.75:1;audio.preservesPitch=true;
    $('audio-status').textContent=`${lang==='ja'?'日本語':'ポルトガル語'}の音声を読み込んでいます…`;
    try{await audio.play();if(token!==playToken)return;$('sound-wave').classList.add('playing');$('audio-status').textContent=`${lang==='ja'?word.ja:word.pt} を再生中`;
      heard.add(word.id);$('discovered').textContent=`${heard.size} / ${words.length}`;$('progress-fill').style.width=`${heard.size/words.length*100}%`;
    }catch(error){if(token===playToken){$('sound-wave').classList.remove('playing');$('audio-status').textContent='音声を再生できませんでした。再生ボタンでもう一度お試しください。';}}
  }
  audio.addEventListener('ended',()=>{$('sound-wave').classList.remove('playing');$('audio-status').textContent='もう一度聴くときは、再生ボタンを押してください。';});
  audio.addEventListener('error',()=>{$('sound-wave').classList.remove('playing');$('audio-status').textContent='音声を読み込めませんでした。通信状態を確認して再生してください。';});
  function setLanguage(lang){language=lang;$('choose-ja').setAttribute('aria-pressed',String(lang==='ja'));$('choose-pt').setAttribute('aria-pressed',String(lang==='pt'));stop();$('audio-status').textContent=`絵をタップすると${lang==='ja'?'日本語':'ポルトガル語'}が流れます。`;}
  $('choose-ja').onclick=()=>setLanguage('ja');$('choose-pt').onclick=()=>setLanguage('pt');$('play-ja').onclick=()=>play('ja');$('play-pt').onclick=()=>play('pt');
  $('slow').onclick=()=>{slow=!slow;$('slow').setAttribute('aria-pressed',String(slow));audio.playbackRate=slow?.75:1;};
  function setZoom(value){zoom=Math.max(1,Math.min(3,value));$('scene-canvas').style.width=`${zoom*100}%`;$('scene-viewport').style.maxHeight=zoom===1?'none':'65vh';$('zoom-label').textContent=`${Math.round(zoom*100)}%`;$('zoom-out').disabled=zoom===1;$('zoom-in').disabled=zoom===3;if(zoom===1)$('scene-viewport').scrollTo(0,0);}
  $('zoom-in').onclick=()=>setZoom(zoom+.5);$('zoom-out').onclick=()=>setZoom(zoom-.5);$('zoom-reset').onclick=()=>setZoom(1);
  $('show-numbers').onchange=e=>$('scene').classList.toggle('hide-numbers',!e.target.checked);
  $('show-original').onclick=()=>{$('original-dialog').showModal();};$('close-original').onclick=()=>$('original-dialog').close();
  $('original-dialog').addEventListener('click',e=>{if(e.target===$('original-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  select(words[0],false,false);setZoom(1);
})();
