(() => {
  'use strict';
  const scenes=window.SCENES, $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
  const seasons={spring:{ja:'はる',pt:'Primavera',color:'#e5a69c'},summer:{ja:'なつ',pt:'Verão',color:'#e5be61'},autumn:{ja:'あき',pt:'Outono',color:'#d79b62'},winter:{ja:'ふゆ',pt:'Inverno',color:'#87aeba'}};
  let current, words=[], selected, language='ja', zoom=1, slow=false, playToken=0;
  const heard=new Map(),audio=$('audio'),groups=new Map(),buttons=new Map();
  function svg(tag,attrs){const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
  function stop(){playToken++;audio.pause();audio.currentTime=0;$('sound-wave').classList.remove('playing');}
  function updateProgress(){const count=heard.get(current.id)?.size||0;$('discovered').textContent=`${count} / ${words.length}`;$('progress-fill').style.width=`${count/words.length*100}%`;}
  function updateMarkers(){for(const marker of document.querySelectorAll('[data-marker]'))marker.classList.toggle('is-selected',marker.dataset.marker===selected?.id);}
  function select(word,autoplay,center){
    stop();selected=word;
    const index=words.indexOf(word);$('selected-number').textContent=String(index+1).padStart(2,'0');$('selected-ja').textContent=word.ja;$('selected-pt').textContent=word.pt;$('word-player').classList.toggle('is-phrase',word.kind==='phrase');
    for(const w of words){groups.get(w.id).classList.toggle('is-selected',w.id===word.id);groups.get(w.id).setAttribute('aria-pressed',String(w.id===word.id));buttons.get(w.id).setAttribute('aria-pressed',String(w.id===word.id));}
    updateMarkers();$('audio-status').textContent='再生ボタンでことばを聴けます。';
    if(center && zoom>1){const viewport=$('scene-viewport'),canvas=$('scene-canvas');viewport.scrollTo({left:word.marker[0]/1000*canvas.clientWidth-viewport.clientWidth/2,top:word.marker[1]/707*canvas.clientHeight-viewport.clientHeight/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
    if(autoplay)play(language);
  }
  async function play(lang){
    stop();const token=playToken,word=selected,scene=current;
    audio.src=word.audio[lang];audio.playbackRate=slow?.75:1;audio.preservesPitch=true;
    $('audio-status').textContent=`${lang==='ja'?'日本語':'ポルトガル語'}の音声を読み込んでいます…`;
    try{await audio.play();if(token!==playToken)return;$('sound-wave').classList.add('playing');$('audio-status').textContent=`${lang==='ja'?word.ja:word.pt} を再生中`;
      if(!heard.has(scene.id))heard.set(scene.id,new Set());heard.get(scene.id).add(word.id);updateProgress();
    }catch(error){if(token===playToken){$('sound-wave').classList.remove('playing');$('audio-status').textContent='音声を再生できませんでした。再生ボタンでもう一度お試しください。';}}
  }
  function renderScene(scene){
    $('cover-page').hidden=true;$('scene-page').hidden=false;document.querySelector('.chapter').hidden=false;
    stop();current=scene;words=scene.words;groups.clear();buttons.clear();$('hotspots').replaceChildren();$('word-list').replaceChildren();
    const season=seasons[scene.season],index=scenes.indexOf(scene);
    document.title=`${scene.titleJa} | ことばの絵じてん`;$('scene-title-ja').textContent=scene.titleJa;$('scene-title-pt').textContent=scene.titlePt;$('season-label').textContent=scene.seasonLabel||`${season.ja} · ${season.pt}`;document.querySelector('.spring-dot').style.background=season.color;
    $('chapter-number').textContent=`${String(index+1).padStart(2,'0')} / ${scenes.length}`;$('vocabulary-title').textContent=scene.listTitle;$('word-count').textContent=`${words.length}項目`;
    $('scene-image').setAttribute('href',scene.image);$('scene').setAttribute('aria-label',`${scene.titleJa}。絵の対象を選ぶとことばを聴けます。`);$('original-image').src=scene.original;$('original-image').alt=`元の${scene.titleJa}の手描きの絵。`;
    $('scene-select').value=scene.id;$('previous-scene').disabled=index===0;$('next-scene').disabled=index===scenes.length-1;
    for(const word of [...words].sort((a,b)=>b.rect[2]*b.rect[3]-a.rect[2]*a.rect[3])){
      const wordIndex=words.indexOf(word),g=svg('g',{'class':'hotspot','role':'button','tabindex':'0','aria-label':`${word.ja} / ${word.pt}`,'aria-pressed':'false','data-word':word.id});
      const [x,y,width,height]=word.rect;g.append(svg('rect',{x,y,width,height,'class':'hit'}));
      g.addEventListener('click',()=>select(word,true,false));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(word,true,false);}});$('hotspots').append(g);groups.set(word.id,g);
      const button=document.createElement('button');button.className='word-item';button.dataset.word=word.id;button.setAttribute('aria-pressed','false');
      const number=document.createElement('span');number.className='item-number';number.textContent=String(wordIndex+1).padStart(2,'0');const name=document.createElement('span');name.className='item-name';const ja=document.createElement('span');ja.textContent=word.ja;const pt=document.createElement('small');pt.lang='pt-BR';pt.textContent=word.pt;name.append(ja,pt);const icon=svg('svg',{'aria-hidden':'true'});icon.append(svg('use',{href:'#speaker'}));button.append(number,name,icon);
      button.addEventListener('click',()=>select(word,true,true));buttons.set(word.id,button);
    }
    for(const word of words)$('word-list').append(buttons.get(word.id));
    // Numbered buttons stay above the regions, even when nearby objects have overlapping rectangles.
    for(const [index,word] of words.entries()){
      const marker=svg('g',{'class':'marker','data-marker':word.id,'aria-hidden':'true'});marker.append(svg('circle',{cx:word.marker[0],cy:word.marker[1],r:16}));const number=svg('text',{x:word.marker[0],y:word.marker[1]});number.textContent=index+1;marker.append(number);marker.addEventListener('click',()=>select(word,true,false));$('hotspots').append(marker);
    }
    select(words[0],false,false);setZoom(1);updateProgress();$('scene-announcement').textContent=`${index+1}番目の場面、${scene.titleJa}を表示しました。`;
    for(const button of document.querySelectorAll('.scene-card'))button.setAttribute('aria-current',button.dataset.scene===scene.id?'page':'false');
  }
  function goScene(id){const scene=scenes.find(s=>s.id===id);if(!scene)return;if(current?.id!==id||$('scene-page').hidden)renderScene(scene);location.hash=`scene-${id}`;}
  function readHash(){const match=location.hash.match(/^#scene-(\d\d)$/);const scene=scenes.find(s=>s.id===match?.[1]);if(scene){if(current?.id!==scene.id||$('scene-page').hidden)renderScene(scene);}else{stop();$('cover-page').hidden=false;$('scene-page').hidden=true;document.querySelector('.chapter').hidden=true;document.title='表紙 | ことばの絵じてん';} }
  for(const [key,season] of Object.entries(seasons)){
    const options=document.createElement('optgroup');options.label=`${season.ja} · ${season.pt}`;const section=document.createElement('section');section.className='contents-season';const title=document.createElement('h3');title.textContent=`${season.ja} · ${season.pt}`;section.append(title);const grid=document.createElement('div');grid.className='scene-grid';
    for(const scene of scenes.filter(s=>s.season===key)){
      const option=document.createElement('option');option.value=scene.id;option.textContent=`${String(scenes.indexOf(scene)+1).padStart(2,'0')} ${scene.titleJa}`;options.append(option);
      const card=document.createElement('button');card.className='scene-card';card.dataset.scene=scene.id;const image=document.createElement('img');image.src=scene.image;image.alt='';image.loading='lazy';const ja=document.createElement('strong');ja.textContent=scene.titleJa;const pt=document.createElement('span');pt.lang='pt-BR';pt.textContent=scene.titlePt;card.append(image,ja,pt);card.onclick=()=>{goScene(scene.id);$('contents-dialog').close();};grid.append(card);
    }
    if(options.children.length){$('scene-select').append(options);section.append(grid);$('contents-list').append(section);}
  }
  $('scene-select').onchange=e=>goScene(e.target.value);$('previous-scene').onclick=()=>goScene(scenes[scenes.indexOf(current)-1].id);$('next-scene').onclick=()=>goScene(scenes[scenes.indexOf(current)+1].id);window.addEventListener('hashchange',readHash);
  $('cover-contents').onclick=()=>$('contents-dialog').showModal();
  audio.addEventListener('ended',()=>{$('sound-wave').classList.remove('playing');$('audio-status').textContent='もう一度聴くときは、再生ボタンを押してください。';});
  audio.addEventListener('error',()=>{$('sound-wave').classList.remove('playing');$('audio-status').textContent='音声を読み込めませんでした。通信状態を確認して再生してください。';});
  function setLanguage(lang){language=lang;$('choose-ja').setAttribute('aria-pressed',String(lang==='ja'));$('choose-pt').setAttribute('aria-pressed',String(lang==='pt'));stop();$('audio-status').textContent=`絵をタップすると${lang==='ja'?'日本語':'ポルトガル語'}が流れます。`;}
  $('choose-ja').onclick=()=>setLanguage('ja');$('choose-pt').onclick=()=>setLanguage('pt');$('play-ja').onclick=()=>play('ja');$('play-pt').onclick=()=>play('pt');
  $('slow').onclick=()=>{slow=!slow;$('slow').setAttribute('aria-pressed',String(slow));audio.playbackRate=slow?.75:1;};
  function setZoom(value){zoom=Math.max(1,Math.min(3,value));$('scene-canvas').style.width=`${zoom*100}%`;$('scene-viewport').style.maxHeight=zoom===1?'none':'65vh';$('zoom-label').textContent=`${Math.round(zoom*100)}%`;$('zoom-out').disabled=zoom===1;$('zoom-in').disabled=zoom===3;if(zoom===1)$('scene-viewport').scrollTo(0,0);}
  $('zoom-in').onclick=()=>setZoom(zoom+.5);$('zoom-out').onclick=()=>setZoom(zoom-.5);$('zoom-reset').onclick=()=>setZoom(1);
  $('show-numbers').onchange=e=>$('scene').classList.toggle('hide-numbers',!e.target.checked);
  for(const name of ['original','contents']){$(`show-${name}`).onclick=()=>$(`${name}-dialog`).showModal();$(`close-${name}`).onclick=()=>$(`${name}-dialog`).close();$(`${name}-dialog`).addEventListener('click',e=>{if(e.target===$(`${name}-dialog`)){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});readHash();
})();
