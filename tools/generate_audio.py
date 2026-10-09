"""Generate new speech; no original recordings are used."""
import sys, asyncio, json, re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/python-packages'))
import edge_tts

VOICES={'ja':'ja-JP-NanamiNeural','pt':'pt-BR-FranciscaNeural'}
WORDS=[('chair','いす','cadeira'),('bag','かばん','bolsa'),('scissors','はさみ','tesoura'),('hat','ぼうし','chapéu'),('table','つくえ','mesa'),('crayons','クレヨン','giz de cera'),('clothes','ふく','roupa'),('door','ドア','porta'),('shoes','くつ','sapato'),('socks','くつした','meia'),('teacher','せんせい','professora')]

async def main():
    voices=await edge_tts.list_voices()
    for code,name in VOICES.items():
        if name not in {v['ShortName'] for v in voices}: raise RuntimeError(f'Voice unavailable: {name}')
    output=ROOT/'dist/audio'; output.mkdir(exist_ok=True,parents=True)
    records=[]; sem=asyncio.Semaphore(3)
    async def generate(id,lang,text):
        async with sem:
            file=output/f'{id}-{lang}.mp3'
            await edge_tts.Communicate(text,VOICES[lang],rate='-15%').save(str(file))
            if file.stat().st_size<1000: raise RuntimeError(f'Empty audio: {file.name}')
            records.append({'id':id,'lang':lang,'text':text,'voice':VOICES[lang],'rate':'-15%','path':f'audio/{file.name}','bytes':file.stat().st_size,'review_status':'generated-unreviewed'})
            print(file.name,file.stat().st_size,flush=True)
    await asyncio.gather(*(generate(id,lang,text) for id,ja,pt in WORDS for lang,text in [('ja',ja),('pt',pt)]))
    manifest={'source':'Newly generated speech via Microsoft Edge online TTS, using edge-tts 7.2.8','generated_at':datetime.now(timezone.utc).isoformat(),'original_recordings_used':False,'items':sorted(records,key=lambda x:(x['id'],x['lang']))}
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Generated',len(records),'new audio files')

asyncio.run(main())
