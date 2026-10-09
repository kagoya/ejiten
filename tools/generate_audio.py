"""Generate scene speech from the checked-in scripts; reuse matching generated files only."""
import sys, asyncio, json
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/python-packages'))
import edge_tts
VOICES={'ja':'ja-JP-NanamiNeural','pt':'pt-BR-FranciscaNeural'}
RATE='-15%'

async def main():
    scenes=json.loads((ROOT/'dist/scenes.json').read_text(encoding='utf-8'))
    output=ROOT/'dist/audio'; output.mkdir(exist_ok=True,parents=True)
    manifest_file=output/'manifest.json'
    previous=json.loads(manifest_file.read_text(encoding='utf-8')) if manifest_file.exists() else {'items':[]}
    cached={record['path']:record for record in previous['items']}
    records=[]; sem=asyncio.Semaphore(3); generated=0; reused=0
    def persist():
        manifest={'source':'Newly generated speech via Microsoft Edge online TTS, using edge-tts 7.2.8','updated_at':datetime.now(timezone.utc).isoformat(),'original_recordings_used':False,'scene_count':len(scenes),'items':sorted(records,key=lambda x:(x['scene'],x['id'],x['lang']))}
        temp=manifest_file.with_suffix('.tmp');temp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8');temp.replace(manifest_file)
    async def generate(scene,word,lang):
        nonlocal generated,reused
        text=word.get('ttsJa',word['ja']) if lang=='ja' else word.get('ttsPt',word['pt'])
        path=word['audio'][lang];file=ROOT/'dist'/path
        old=cached.get(path)
        if file.exists() and file.stat().st_size>1000 and old and all(old.get(k)==v for k,v in {'text':text,'voice':VOICES[lang],'rate':RATE}.items()):
            records.append({**old,'scene':scene['id']});reused+=1;persist();return
        async with sem:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text,VOICES[lang],rate=RATE).save(str(file))
                    if file.stat().st_size<1000:raise RuntimeError(f'Empty audio: {file.name}')
                    break
                except Exception:
                    if attempt==2:raise
                    await asyncio.sleep(1+attempt)
            records.append({'scene':scene['id'],'id':word['id'],'lang':lang,'text':text,'voice':VOICES[lang],'rate':RATE,'path':path,'bytes':file.stat().st_size,'generated_at':datetime.now(timezone.utc).isoformat(),'review_status':'generated-unreviewed'})
            generated+=1;persist()
            if generated%20==0: print('Generated',generated,'audio files',flush=True)
    await asyncio.gather(*(generate(scene,word,lang) for scene in scenes for word in scene['words'] for lang in ['ja','pt']))
    persist();print(json.dumps({'scenes':len(scenes),'total':len(records),'generated':generated,'reused':reused}),flush=True)

asyncio.run(main())
