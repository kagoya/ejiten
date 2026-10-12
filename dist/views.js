(() => {
  'use strict';
  const valid=['ja','pt','kids','kids-pt'], url=new URL(location.href);
  let saved='ja'; try{saved=localStorage.getItem('ejiten-view')||'ja';}catch{}
  let mode=valid.includes(url.searchParams.get('view'))?url.searchParams.get('view'):(valid.includes(saved)?saved:'ja');
  const isSimple=()=>mode==='kids'||mode==='kids-pt';
  const isPortuguese=()=>mode==='pt'||mode==='kids-pt';
  const t=(ja,pt,kids=ja,kidsPt=pt)=>mode==='kids-pt'?kidsPt:mode==='pt'?pt:mode==='kids'?kids:ja;
  window.EJITEN_VIEW={get mode(){return mode;},get simple(){return isSimple();},get portuguese(){return isPortuguese();},t};
  const bindings=[];
  const simplePt={'.cover-link':'🏠','#show-contents':'▦','#cover-page .cover-intro h1':'Toque na imagem','#cover-page .cover-intro>p:last-child':'Toque para ouvir.','.cover-start':'▶ Brincar','#cover-contents':'▦ Escolher','.cover-art figcaption':'Toque aqui!','.lead':'Toque na imagem.','#language-label':'Ouvir em','#previous-scene':'←','#next-scene':'→','#slow':'Devagar','#contents-title':'Qual imagem?','#close-original,#close-contents':'×'};
  function bind(selector,pt,kids){const kidsPt=simplePt[selector]??(kids?.includes('language-flag')?kids.replace('にほんご','Japonês'):pt);for(const el of document.querySelectorAll(selector))bindings.push({el,ja:el.innerHTML,pt,kids,kidsPt});}
  bind('.brand-title','Dicionário ilustrativo<br>Português e japonês (edição digital)<small>Português × 日本語</small>');
  bind('.cover-link','Capa','🏠');
  bind('#show-contents','Cenas ▦','▦');
  bind('#cover-page .cover-intro h1','Dicionário ilustrativo<br>Português e japonês (edição digital)','えを さわってみよう');
  bind('#cover-page .cover-intro>p:last-child','Explore 12 cenas das quatro estações com imagens e sons.','さわると こえが きこえるよ');
  bind('.cover-start','Abrir o dicionário →','▶ あそぶ');
  bind('#cover-contents','Escolher uma cena','▦ えをえらぶ');
  bind('.cover-art figcaption','Toque na capa para escolher uma cena.','ここを さわってね');
  bind('.cover-credit-link a','Sobre este dicionário e créditos →');
  bind('.lead','Toque nos objetos da imagem para ouvir as palavras.','えを さわってね');
  bind('#language-label','Idioma ao tocar na imagem','きく ことば');
  bind('#choose-ja','Japonês','<svg class="language-flag" viewBox="0 0 30 20" aria-hidden="true"><rect x=".5" y=".5" width="29" height="19" rx="1" fill="white" stroke="#cbd4c4"/><circle cx="15" cy="10" r="6" fill="#bc002d"/></svg> にほんご'); bind('#choose-pt','Português','<svg class="language-flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" rx="1" fill="#009b3a"/><path d="M15 2 28 10 15 18 2 10Z" fill="#fedf00"/><circle cx="15" cy="10" r="5" fill="#002776"/><path d="M10 9a16 16 0 0 1 10 2" fill="none" stroke="white" stroke-width="1"/></svg> Português');
  bind('#previous-scene','← Cena anterior','←'); bind('#next-scene','Próxima cena →','→');
  bind('.scene-navigation .sr-only','Escolher uma cena'); bind('#number-label','Mostrar números');
  bind('.picture-caption>span','Amplie a imagem ou use a lista para selecionar objetos pequenos.');
  bind('#show-original','Ver o desenho original ↗');
  bind('#play-ja>span','Ouvir em japonês<small>日本語</small>','<svg class="language-flag" viewBox="0 0 30 20" aria-hidden="true"><rect x=".5" y=".5" width="29" height="19" rx="1" fill="white" stroke="#cbd4c4"/><circle cx="15" cy="10" r="6" fill="#bc002d"/></svg> にほんご');
  bind('#play-pt>span','Ouvir em português<small>Português do Brasil</small>','<svg class="language-flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" rx="1" fill="#009b3a"/><path d="M15 2 28 10 15 18 2 10Z" fill="#fedf00"/><circle cx="15" cy="10" r="5" fill="#002776"/><path d="M10 9a16 16 0 0 1 10 2" fill="none" stroke="white" stroke-width="1"/></svg> Português');
  bind('#slow','Ouvir devagar','ゆっくり');
  bind('.list-help','Selecione uma palavra para destacar o objeto e ouvir o áudio.');
  bind('.discovery>span','Palavras ouvidas');
  bind('footer>p','Veja, ouça e repita.');
  bind('footer>span','Áudios sintetizados em japonês e português. <a href="credits.html">Créditos</a>');
  bind('#original-dialog h2','Desenho original feito à mão');
  bind('#original-dialog>p','Esta nova ilustração segue a composição do original, com as palavras exibidas separadamente.');
  bind('#contents-title','Escolha uma estação e uma cena','どの えに する？');
  bind('#close-original,#close-contents','Fechar ×','×');
  bind('.credits-page .cover-intro h1','Sobre este dicionário<br>Créditos');
  bind('.credits-page .cover-intro>p:last-child','Conheça os autores e as informações de publicação da obra original.');
  bind('#original-credits','Informações da publicação original');
  const terms=['Título','Primeira edição','Ilustrações','Texto e organização','Ilustrações e organização','Supervisão','Publicação','Endereço','Impressão e encadernação'];
  document.querySelectorAll('[aria-labelledby="original-credits"] dt').forEach((el,i)=>bindings.push({el,ja:el.innerHTML,pt:terms[i]}));
  bind('.credit-facsimile figcaption','Créditos originais, incluindo os responsáveis pelas ilustrações, texto e organização.');
  bind('.credit-enlarge summary','Ampliar os créditos originais');
  bind('.credit-enlarge>p','No celular, deslize para os lados para ler.');
  bind('#jacket-title','Lombada e contracapa'); bind('[aria-labelledby="jacket-title"]>p:first-of-type','A apresentação do livro também faz parte da obra original.');
  bind('.spine-art figcaption','Lombada'); bind('.back-art figcaption','Contracapa');
  bind('.spine-caption','Texto da lombada: ぽるとがるご にほんご ことばえじてん／仁愛大学人間生活学部子ども教育学科');
  bind('.credits-page .credit-section:last-of-type h2','Sobre a edição digital');
  bind('.digital-credit dt','Edição digital');
  bind('.credits-page .credit-section:last-of-type>p:first-of-type','Esta edição web segue as cenas da obra original, com novas ilustrações geradas e áudios sintetizados em japonês e português do Brasil. A capa, a lombada e a contracapa usam os desenhos originais.');
  bind('.credits-page .credit-section:last-of-type>p:last-of-type','As informações acima se referem à obra original, publicada em 2020. Os áudios e as ilustrações gerados para a edição web não são trabalhos dos autores da obra original.');
  bind('.credits-page .cover-actions>a:last-child','Voltar à capa');
  const aria={'表紙画像から目次を開く':'Abrir as cenas pela capa','場面の移動':'Navegação entre cenas','場面の絵と再生':'Imagem da cena e áudio','絵を縮小':'Diminuir a imagem','絵を拡大':'Ampliar a imagem','絵を全体表示':'Mostrar a imagem inteira','元の絵を閉じる':'Fechar o desenho original','目次を閉じる':'Fechar as cenas','日本とブラジルの国旗':'Bandeiras do Japão e do Brasil','教室のことば':'Palavras da cena'};
  const ariaBindings=[];for(const el of document.querySelectorAll('[aria-label],[alt]'))for(const attr of ['aria-label','alt']){const ja=el.getAttribute(attr);if(aria[ja])ariaBindings.push({el,attr,ja,pt:aria[ja]});}
  function apply(){
    try{localStorage.setItem('ejiten-view',mode);}catch{}
    document.documentElement.lang=isPortuguese()?'pt-BR':'ja';document.body.dataset.view=mode;document.body.dataset.simple=String(isSimple());
    for(const b of bindings)b.el.innerHTML=t(b.ja,b.pt,b.kids??b.ja,b.kidsPt??b.pt);
    for(const b of ariaBindings)b.el.setAttribute(b.attr,t(b.ja,b.pt));
    document.getElementById('view-select').value=mode;
    document.querySelector('.brand').setAttribute('aria-label',t('ぽるとがるご にほんご ことばえじてん（デジタル版） 表紙','Dicionário ilustrativo em português e japonês — capa','ひょうし'));
    for(const el of document.querySelectorAll('.cover-link'))el.setAttribute('aria-label',t('表紙','Capa','ひょうし'));
    document.getElementById('show-contents')?.setAttribute('aria-label',t('目次','Cenas','えをえらぶ'));
    document.getElementById('kids-contents')?.setAttribute('aria-label',t('えをえらぶ','Escolher uma imagem'));
    const gallery=document.getElementById('kids-contents');if(gallery)gallery.textContent=t('▦ えをえらぶ','▦ Escolher');
    if(document.querySelector('.credits-page'))document.title=t('この絵辞典について・クレジット | ぽるとがるご にほんご ことばえじてん（デジタル版）','Créditos | Dicionário ilustrativo em português e japonês (edição digital)');
  }
  document.getElementById('view-select').addEventListener('change',e=>{
    mode=e.target.value;try{localStorage.setItem('ejiten-view',mode);}catch{}
    const next=new URL(location.href);if(mode==='ja')next.searchParams.delete('view');else next.searchParams.set('view',mode);history.replaceState(null,'',next);
    apply();window.dispatchEvent(new Event('ejiten-view-change'));
  });
  apply();
})();
